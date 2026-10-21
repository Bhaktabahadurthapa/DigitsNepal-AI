/** Background job handlers executed by the worker (src/worker.ts). Each handler is idempotent. */
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/server/db";
import type { Citation, CourseOutline } from "@/server/db/schema";
import { log } from "@/server/log";
import { outlineSchema } from "@/lib/validation";
import { ai, AiServiceError, type AiSource } from "./ai-client";
import { recordUsage } from "./ai-guard";
import { checkUpload } from "./files";
import { chunkPages, extractText } from "./ingest";
import { addJobUsage, type Job, NonRetryableError, setJobProgress } from "./jobs";
import { chunksForDocuments, searchChunks } from "./retrieval";
import { storage } from "./storage";

const EMBED_BATCH = 64;
const SOURCE_CHARS = 1800;

function opts(job: Job) {
  return { forceExtractive: job.payload?.forceExtractive === true };
}

async function usage(job: Job, u: Parameters<typeof recordUsage>[0], feature: Parameters<typeof recordUsage>[1]) {
  await recordUsage(u, feature, { userId: job.ownerId, organizationId: job.organizationId, jobId: job.id });
  await addJobUsage(job.id, u.tokens_in, u.tokens_out, u.cost_usd);
}

// ─── extract_source ─────────────────────────────────────────────────────────
export async function handleExtract(job: Job) {
  if (!job.documentId) throw new NonRetryableError("missing document id");
  const [doc] = await db.select().from(schema.sourceDocuments).where(eq(schema.sourceDocuments.id, job.documentId));
  if (!doc || doc.deletedAt) throw new NonRetryableError("document no longer exists");
  await db.update(schema.sourceDocuments).set({ status: "processing", error: null }).where(eq(schema.sourceDocuments.id, doc.id));
  try {
    const bytes = await storage().get(doc.storageKey);
    const check = checkUpload(doc.filename, bytes);
    if (!check.ok) throw new NonRetryableError(`file rejected: ${check.reason}`);
    await setJobProgress(job.id, 10, "Extracting text");
    const pages = await extractText(check.ext, bytes);
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new NonRetryableError("No readable text found. Scanned PDFs (images) are not supported yet; upload a text-based PDF, DOCX or TXT.");
    }
    if (chunks.length > 2000) throw new NonRetryableError("Document is too long (more than 2000 passages). Split it into smaller files.");

    await db.delete(schema.sourceChunks).where(eq(schema.sourceChunks.documentId, doc.id));
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const emb = await ai.embed(batch.map((c) => (c.heading ? `${c.heading}\n${c.content}` : c.content)), "document");
      await usage(job, emb.usage, "embed");
      await db.insert(schema.sourceChunks).values(
        batch.map((c, j) => ({ ...c, documentId: doc.id, embedding: emb.vectors[j], embeddingModel: `${emb.usage.provider}:${emb.usage.model}` })),
      );
      await setJobProgress(job.id, 10 + (80 * Math.min(chunks.length, i + EMBED_BATCH)) / chunks.length, "Indexing passages");
    }
    const flagged = chunks.filter((c) => c.flaggedInjection).length;
    await db
      .update(schema.sourceDocuments)
      .set({
        status: "ready",
        pageCount: pages.filter((p) => p.page !== null).length || null,
        charCount: chunks.reduce((n, c) => n + c.content.length, 0),
        injectionFlags: flagged,
      })
      .where(eq(schema.sourceDocuments.id, doc.id));
    return { chunks: chunks.length, flagged };
  } catch (e) {
    const permanent = e instanceof NonRetryableError || job.attempts >= job.maxAttempts;
    await db
      .update(schema.sourceDocuments)
      .set(permanent ? { status: "failed", error: (e as Error).message.slice(0, 500) } : { status: "uploaded" })
      .where(eq(schema.sourceDocuments.id, doc.id));
    throw e;
  }
}

// ─── generate_outline ───────────────────────────────────────────────────────
const SHAPE = {
  course: { modules: 3, lessons: 2 },
  assessment: { modules: 1, lessons: 3 },
  lesson: { modules: 1, lessons: 1 },
} as const;

/** Evenly sample passages so outline cost stays bounded regardless of document size. */
function sample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  return Array.from({ length: n }, (_, i) => items[Math.floor(i * step)]);
}

export async function handleOutline(job: Job) {
  const courseId = job.courseId!;
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));
  if (!course) throw new NonRetryableError("course not found");
  const docIds = (await db.select({ id: schema.courseSources.documentId }).from(schema.courseSources).where(eq(schema.courseSources.courseId, courseId))).map((r) => r.id);
  const chunks = sample(await chunksForDocuments(docIds, 2000), 40);
  if (chunks.length === 0) throw new NonRetryableError("No indexed source passages found for this course.");
  await setJobProgress(job.id, 20, "Reading your sources");
  const shape = SHAPE[course.learningType];
  const out = await ai.outline(
    {
      title: course.title,
      audience: course.audience,
      level: course.level,
      language: course.language,
      learning_type: course.learningType,
      objectives: course.objectives,
      target_modules: shape.modules,
      lessons_per_module: shape.lessons,
      sources: chunks.map(toSource),
    },
    opts(job),
  );
  await usage(job, out.usage, "outline");
  const valid = new Set(chunks.map((c) => c.id));
  const outline: CourseOutline = outlineSchema.parse({
    modules: out.outline.modules.map((m) => ({
      title: m.title,
      summary: m.summary,
      lessons: m.lessons.map((l) => ({ title: l.title, objectives: l.objectives, sourceChunkIds: l.source_ids.filter((id) => valid.has(id)) })),
    })),
    notes: out.outline.notes,
  });
  await db.update(schema.courses).set({ outline, outlineStatus: "proposed", status: "draft" }).where(eq(schema.courses.id, courseId));
  return { modules: outline.modules.length, provider: out.usage.provider };
}

function toSource(c: { id: string; filename: string; heading: string | null; content: string; pageStart: number | null }): AiSource {
  return { id: c.id, filename: c.filename, heading: c.heading, content: c.content.slice(0, SOURCE_CHARS), page: c.pageStart };
}

// ─── generate_course ────────────────────────────────────────────────────────
export async function handleGenerateCourse(job: Job) {
  const courseId = job.courseId!;
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));
  if (!course) throw new NonRetryableError("course not found");
  if (course.outlineStatus !== "approved" || !course.outline) throw new NonRetryableError("Outline has not been approved by an educator.");
  const docIds = (await db.select({ id: schema.courseSources.documentId }).from(schema.courseSources).where(eq(schema.courseSources.courseId, courseId))).map((r) => r.id);

  // 1. Create the structure once (idempotent across retries).
  const existing = await db.select({ id: schema.modules.id }).from(schema.modules).where(eq(schema.modules.courseId, courseId));
  if (existing.length === 0) {
    await db.transaction(async (tx) => {
      let lessonPos = 0;
      for (const [mi, m] of course.outline!.modules.entries()) {
        const [mod] = await tx.insert(schema.modules).values({ courseId, position: mi, title: m.title, summary: m.summary ?? "" }).returning();
        for (const l of m.lessons) {
          await tx.insert(schema.lessons).values({
            courseId,
            moduleId: mod.id,
            position: lessonPos++,
            title: l.title,
            objectives: l.objectives,
            origin: "ai",
            status: "pending",
            // Remember which passages the outline linked, for retrieval below.
            citations: (l.sourceChunkIds ?? []).map((id, i) => ({ n: i + 1, chunkId: id, documentId: "", filename: "", quote: "" })),
          });
        }
      }
    });
  }

  // 2. Generate each pending lesson.
  const todo = await db
    .select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.courseId, courseId), ne(schema.lessons.status, "ready")))
    .orderBy(asc(schema.lessons.position));
  const total = (await db.select({ id: schema.lessons.id }).from(schema.lessons).where(eq(schema.lessons.courseId, courseId))).length;
  let done = total - todo.length;
  const questionCount = course.learningType === "assessment" ? 5 : 3;

  for (const lesson of todo) {
    await setJobProgress(job.id, 5 + (90 * done) / total, `Writing lesson ${done + 1} of ${total}: ${lesson.title}`);
    const hinted = lesson.citations.map((c) => c.chunkId).filter(Boolean);
    const q = await ai.embed([`${lesson.title}\n${lesson.objectives.join("\n")}`], "query", opts(job));
    await usage(job, q.usage, "embed");
    const retrieved = await searchChunks(docIds, q.vectors[0], 6);
    const hintedRows = hinted.length ? (await chunksForDocuments(docIds, 2000)).filter((c) => hinted.includes(c.id)) : [];
    const chosen = dedupe([...hintedRows, ...retrieved]).slice(0, 8);
    if (chosen.length === 0) throw new NonRetryableError("No source passages available for lesson generation.");

    try {
      const out = await ai.lesson(
        {
          course_title: course.title,
          lesson_title: lesson.title,
          objectives: lesson.objectives,
          language: course.language,
          level: course.level,
          sources: chosen.map(toSource),
          question_count: questionCount,
        },
        opts(job),
      );
      await usage(job, out.usage, "lesson");
      const byId = new Map(chosen.map((c) => [c.id, c]));
      const citations: Citation[] = out.citations.flatMap((c) => {
        const ch = byId.get(c.source_id);
        return ch ? [{ n: c.n, chunkId: ch.id, documentId: ch.documentId, filename: ch.filename, quote: c.quote, page: ch.pageStart }] : [];
      });
      const words = out.content_md.split(/\s+/).length;
      await db.transaction(async (tx) => {
        await tx
          .update(schema.lessons)
          .set({ contentMd: out.content_md, citations, flashcards: out.flashcards, estimatedMinutes: Math.max(2, Math.round(words / 180)), status: "ready" })
          .where(eq(schema.lessons.id, lesson.id));
        await tx.delete(schema.assessments).where(eq(schema.assessments.lessonId, lesson.id));
        if (out.quiz.length) {
          const [a] = await tx.insert(schema.assessments).values({ courseId, lessonId: lesson.id, title: `Quiz: ${lesson.title}`.slice(0, 200) }).returning();
          await tx.insert(schema.questions).values(
            out.quiz.map((qq, i) => {
              const ch = qq.source_id ? byId.get(qq.source_id) : undefined;
              return {
                assessmentId: a.id,
                position: i,
                prompt: qq.prompt,
                options: qq.options,
                correctIndex: qq.correct_index,
                explanation: qq.explanation,
                citation: ch ? { n: 1, chunkId: ch.id, documentId: ch.documentId, filename: ch.filename, quote: ch.content.slice(0, 240), page: ch.pageStart } : null,
              };
            }),
          );
        }
      });
    } catch (e) {
      if (e instanceof AiServiceError && !e.retryable) {
        await db.update(schema.lessons).set({ status: "failed" }).where(eq(schema.lessons.id, lesson.id));
      }
      throw e;
    }
    done++;
  }

  await db.update(schema.courses).set({ status: "in_review" }).where(eq(schema.courses.id, courseId));
  log.info("course.generated", { courseId, lessons: total });
  return { lessons: total };
}

function dedupe<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/** Called by the worker when a course job fails permanently, so the UI can offer a retry. */
export async function onCourseJobFailed(job: Job) {
  if (!job.courseId) return;
  await db
    .update(schema.courses)
    .set({ status: "draft" })
    .where(and(eq(schema.courses.id, job.courseId), inArray(schema.courses.status, ["generating"])));
}
