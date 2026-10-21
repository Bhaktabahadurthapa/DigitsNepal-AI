import { and, asc, desc, eq } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import type { Citation } from "@/server/db/schema";
import { HttpError } from "@/server/errors";
import { canEditCourse, canViewPublishedCourse, loadCourse } from "./access";
import { ai, AiServiceError, type AiSource } from "./ai-client";
import { guardTutor, LimitError, recordUsage } from "./ai-guard";
import { getPlayer, hasOpenQuiz } from "./learning";
import { searchChunks } from "./retrieval";

export type TutorReply = {
  conversationId: string;
  messageId: string;
  answer: string;
  citations: Citation[];
  grounded: boolean;
  mode: "llm" | "extractive";
};

const LESSON_SOURCE_PREFIX = "lesson:";

/**
 * Answer a learner question using ONLY the published course's approved material:
 * its source documents (vector search) plus the text of the current lesson.
 */
export async function askTutor(
  v: Viewer,
  input: { courseId: string; lessonId?: string; conversationId?: string; question: string; language: "en" | "ne" },
): Promise<TutorReply> {
  if (v.isMinor && !v.guardianConsent) throw new HttpError(403, "consent_required");

  const course = await loadCourse(input.courseId);
  const player = await getPlayer(v, input.courseId);
  if (!player) {
    // Visible-but-not-enrolled gets a helpful 403; anything the viewer cannot see stays a 404.
    if ((await canViewPublishedCourse(v, course)) || (await canEditCourse(v, course))) {
      throw new HttpError(403, "enroll_required", "Enroll in the course to use its tutor.");
    }
    throw new HttpError(404, "course_not_found");
  }
  if (await hasOpenQuiz(v.id, input.courseId)) throw new HttpError(423, "quiz_in_progress");

  let guard;
  try {
    guard = await guardTutor(v.id);
  } catch (e) {
    if (e instanceof LimitError) throw new HttpError(429, e.code);
    throw e;
  }

  // Conversation ownership check.
  let conversationId = input.conversationId;
  if (conversationId) {
    const [c] = await db
      .select({ id: schema.aiConversations.id })
      .from(schema.aiConversations)
      .where(and(eq(schema.aiConversations.id, conversationId), eq(schema.aiConversations.userId, v.id), eq(schema.aiConversations.courseId, input.courseId)));
    if (!c) throw new HttpError(404, "conversation_not_found");
  } else {
    const [c] = await db
      .insert(schema.aiConversations)
      .values({ userId: v.id, courseId: input.courseId, lessonId: input.lessonId, language: input.language })
      .returning();
    conversationId = c.id;
  }
  const history = (
    await db.select().from(schema.aiMessages).where(eq(schema.aiMessages.conversationId, conversationId)).orderBy(desc(schema.aiMessages.createdAt)).limit(6)
  ).reverse();

  // Retrieval scoped to the documents of the version the learner is enrolled in.
  const snapshot = player.snapshot;
  const lessons = snapshot.modules.flatMap((m) => m.lessons);
  const lesson = lessons.find((l) => l.id === input.lessonId) ?? null;
  const sources: (AiSource & { citation: Omit<Citation, "n" | "quote"> })[] = [];
  if (snapshot.sourceDocumentIds.length) {
    const emb = await ai.embed([input.question], "query", { forceExtractive: guard.forceExtractive });
    await recordUsage(emb.usage, "embed", { userId: v.id, organizationId: course.organizationId });
    const hits = await searchChunks(snapshot.sourceDocumentIds, emb.vectors[0], 5);
    for (const h of hits) {
      sources.push({
        id: h.id,
        filename: h.filename,
        heading: h.heading,
        content: h.content.slice(0, 2000),
        page: h.pageStart,
        citation: { chunkId: h.id, documentId: h.documentId, filename: h.filename, page: h.pageStart },
      });
    }
  }
  // Lesson text is approved material too: the current lesson always, and every lesson when the
  // course has no uploaded source documents (e.g. curated Academy courses).
  const lessonSources = snapshot.sourceDocumentIds.length
    ? lesson ? [lesson] : []
    : [...(lesson ? [lesson] : []), ...lessons.filter((l) => l.id !== lesson?.id)].slice(0, 6);
  for (const l of lessonSources) {
    sources.push({
      id: `${LESSON_SOURCE_PREFIX}${l.id}`,
      filename: `Lesson: ${l.title}`,
      heading: l.title,
      content: l.contentMd.slice(0, 3000),
      citation: { chunkId: l.id, documentId: "", filename: `Lesson: ${l.title}`, page: null },
    });
  }

  let out;
  try {
    out = await ai.tutor(
      {
        question: input.question,
        language: input.language,
        course_title: snapshot.title,
        lesson_title: lesson?.title ?? "",
        history: history.map((h) => ({ role: h.role, content: h.content.slice(0, 2000) })),
        sources: sources.slice(0, 8).map(({ citation: _c, ...s }) => s),
      },
      { forceExtractive: guard.forceExtractive },
    );
  } catch (e) {
    if (e instanceof AiServiceError) throw new HttpError(503, "tutor_unavailable", "The tutor is temporarily unavailable. Please try again.");
    throw e;
  }
  await recordUsage(out.usage, "tutor", { userId: v.id, organizationId: course.organizationId });

  const byId = new Map(sources.map((s) => [s.id, s]));
  const citations: Citation[] = out.citations.flatMap((c) => {
    const s = byId.get(c.source_id);
    return s ? [{ n: c.n, quote: c.quote, ...s.citation }] : [];
  });

  const [, assistant] = await db
    .insert(schema.aiMessages)
    .values([
      { conversationId, role: "user", content: input.question },
      {
        conversationId,
        role: "assistant",
        content: out.answer,
        citations,
        grounded: out.grounded,
        provider: out.usage.provider,
        model: out.usage.model,
        tokensIn: out.usage.tokens_in,
        tokensOut: out.usage.tokens_out,
        latencyMs: out.usage.latency_ms,
      },
    ])
    .returning({ id: schema.aiMessages.id });

  return {
    conversationId,
    messageId: assistant.id,
    answer: out.answer,
    citations,
    grounded: out.grounded,
    mode: out.usage.provider === "extractive" ? "extractive" : "llm",
  };
}

export async function conversationHistory(v: Viewer, courseId: string) {
  const [c] = await db
    .select()
    .from(schema.aiConversations)
    .where(and(eq(schema.aiConversations.userId, v.id), eq(schema.aiConversations.courseId, courseId)))
    .orderBy(desc(schema.aiConversations.createdAt))
    .limit(1);
  if (!c) return null;
  const messages = await db.select().from(schema.aiMessages).where(eq(schema.aiMessages.conversationId, c.id)).orderBy(asc(schema.aiMessages.createdAt)).limit(40);
  return { conversationId: c.id, messages };
}

export async function rateMessage(v: Viewer, messageId: string, rating: -1 | 1, comment?: string) {
  const [m] = await db
    .select({ id: schema.aiMessages.id, courseId: schema.aiConversations.courseId })
    .from(schema.aiMessages)
    .innerJoin(schema.aiConversations, eq(schema.aiConversations.id, schema.aiMessages.conversationId))
    .where(and(eq(schema.aiMessages.id, messageId), eq(schema.aiConversations.userId, v.id), eq(schema.aiMessages.role, "assistant")));
  if (!m) throw new HttpError(404, "message_not_found");
  await db.insert(schema.feedback).values({ userId: v.id, kind: "tutor", messageId, courseId: m.courseId, rating, comment: comment?.slice(0, 1000) });
}
