import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import type { Citation, CourseSnapshot } from "@/server/db/schema";
import { HttpError } from "@/server/errors";
import { slugify } from "@/lib/utils";
import type { CreateCourseInput, OutlineInput } from "@/lib/validation";
import { documentFitsCourse, isEducator, loadAccessibleDocument, loadEditableCourse, requireOrgRole } from "./access";
import { ai } from "./ai-client";
import { guardStudio, LimitError, recordUsage } from "./ai-guard";
import { audit } from "./audit";
import { enqueueJob } from "./jobs";
import { chunksForDocuments } from "./retrieval";

type Course = typeof schema.courses.$inferSelect;

async function uniqueSlug(title: string) {
  const base = slugify(title);
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const [exists] = await db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.slug, slug));
    if (!exists) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createCourse(v: Viewer, input: CreateCourseInput) {
  if (!isEducator(v)) throw new HttpError(403, "educator_required");
  if (input.organizationId) await requireOrgRole(v, input.organizationId, ["owner", "admin", "member"]);
  const [course] = await db
    .insert(schema.courses)
    .values({
      slug: await uniqueSlug(input.title),
      title: input.title,
      audience: input.audience,
      language: input.language,
      level: input.level,
      objectives: input.objectives,
      learningType: input.learningType,
      organizationId: input.organizationId ?? null,
      visibility: input.organizationId ? (input.visibility === "public" ? "organization" : input.visibility) : input.visibility,
      ownerId: v.id,
    })
    .returning();
  await audit(v.id, "course.created", { type: "course", id: course.id }, { learningType: input.learningType }, course.organizationId);
  return course;
}

export async function listEducatorCourses(v: Viewer) {
  const where = v.roles.includes("admin") ? undefined : eq(schema.courses.ownerId, v.id);
  return db
    .select({
      id: schema.courses.id,
      slug: schema.courses.slug,
      title: schema.courses.title,
      status: schema.courses.status,
      language: schema.courses.language,
      learningType: schema.courses.learningType,
      updatedAt: schema.courses.updatedAt,
      publishedAt: schema.courses.publishedAt,
      enrollments: sql<number>`(select count(*)::int from enrollments e where e.course_id = ${schema.courses.id})`,
    })
    .from(schema.courses)
    .where(and(where, ne(schema.courses.availability, "coming_soon")))
    .orderBy(desc(schema.courses.updatedAt));
}

/** Everything the Studio editor needs, after an authorization check. */
export async function getStudioCourse(v: Viewer, courseId: string) {
  const course = await loadEditableCourse(v, courseId);
  const [mods, lessonRows, assessmentRows, sources, jobs, versions, decisions] = await Promise.all([
    db.select().from(schema.modules).where(eq(schema.modules.courseId, courseId)).orderBy(asc(schema.modules.position)),
    db.select().from(schema.lessons).where(eq(schema.lessons.courseId, courseId)).orderBy(asc(schema.lessons.position)),
    db.select().from(schema.assessments).where(eq(schema.assessments.courseId, courseId)),
    db
      .select({
        id: schema.sourceDocuments.id,
        filename: schema.sourceDocuments.filename,
        status: schema.sourceDocuments.status,
        error: schema.sourceDocuments.error,
        sizeBytes: schema.sourceDocuments.sizeBytes,
        pageCount: schema.sourceDocuments.pageCount,
        injectionFlags: schema.sourceDocuments.injectionFlags,
      })
      .from(schema.courseSources)
      .innerJoin(schema.sourceDocuments, eq(schema.sourceDocuments.id, schema.courseSources.documentId))
      .where(and(eq(schema.courseSources.courseId, courseId), isNull(schema.sourceDocuments.deletedAt))),
    db.select().from(schema.generationJobs).where(eq(schema.generationJobs.courseId, courseId)).orderBy(desc(schema.generationJobs.createdAt)).limit(5),
    db
      .select({ id: schema.courseVersions.id, version: schema.courseVersions.version, publishedAt: schema.courseVersions.publishedAt, changelog: schema.courseVersions.changelog })
      .from(schema.courseVersions)
      .where(eq(schema.courseVersions.courseId, courseId))
      .orderBy(desc(schema.courseVersions.version)),
    db.select().from(schema.reviewDecisions).where(eq(schema.reviewDecisions.courseId, courseId)).orderBy(desc(schema.reviewDecisions.createdAt)).limit(20),
  ]);
  const questionRows = assessmentRows.length
    ? await db.select().from(schema.questions).where(inArray(schema.questions.assessmentId, assessmentRows.map((a) => a.id))).orderBy(asc(schema.questions.position))
    : [];
  return {
    course,
    modules: mods.map((m) => ({
      ...m,
      lessons: lessonRows
        .filter((l) => l.moduleId === m.id)
        .map((l) => {
          const a = assessmentRows.find((x) => x.lessonId === l.id) ?? null;
          return { ...l, assessment: a ? { ...a, questions: questionRows.filter((q) => q.assessmentId === a.id) } : null };
        }),
    })),
    sources,
    jobs,
    versions,
    decisions,
  };
}

export async function attachDocument(v: Viewer, courseId: string, documentId: string) {
  const course = await loadEditableCourse(v, courseId);
  const doc = await loadAccessibleDocument(v, documentId);
  if (!documentFitsCourse(doc, course)) throw new HttpError(400, "document_tenant_mismatch", "This document belongs to a different workspace.");
  await db.insert(schema.courseSources).values({ courseId, documentId }).onConflictDoNothing();
  await audit(v.id, "course.source_attached", { type: "course", id: courseId }, { documentId }, course.organizationId);
}

export async function detachDocument(v: Viewer, courseId: string, documentId: string) {
  const course = await loadEditableCourse(v, courseId);
  if (course.publishedVersionId) {
    const [ver] = await db.select({ snapshot: schema.courseVersions.snapshot }).from(schema.courseVersions).where(eq(schema.courseVersions.id, course.publishedVersionId));
    if (ver?.snapshot.sourceDocumentIds.includes(documentId)) {
      throw new HttpError(409, "source_in_published_version", "This source is used by the published version. Publish a new version first.");
    }
  }
  await db.delete(schema.courseSources).where(and(eq(schema.courseSources.courseId, courseId), eq(schema.courseSources.documentId, documentId)));
}

async function courseDocumentIds(courseId: string) {
  const rows = await db.select({ id: schema.courseSources.documentId }).from(schema.courseSources).where(eq(schema.courseSources.courseId, courseId));
  return rows.map((r) => r.id);
}

function limitToHttp(e: unknown): never {
  if (e instanceof LimitError) {
    throw new HttpError(429, e.code, e.code === "daily_limit" ? "Daily AI generation limit reached." : "Please wait a moment and try again.");
  }
  throw e;
}

export async function requestOutline(v: Viewer, courseId: string) {
  const course = await loadEditableCourse(v, courseId);
  if (course.publishedVersionId) throw new HttpError(409, "already_published", "Published courses are edited directly, not regenerated.");
  if (course.status === "generating") throw new HttpError(409, "already_generating");
  const docIds = await courseDocumentIds(courseId);
  if (docIds.length === 0) throw new HttpError(400, "no_sources", "Add at least one source document first.");
  const docs = await db.select({ status: schema.sourceDocuments.status }).from(schema.sourceDocuments).where(inArray(schema.sourceDocuments.id, docIds));
  // Like the reference product: never start before every source has been fully processed.
  if (docs.some((d) => d.status !== "ready")) throw new HttpError(409, "sources_not_ready", "Wait until all sources have finished processing.");
  const { forceExtractive } = await guardStudio(v.id).catch(limitToHttp);
  await db.update(schema.courses).set({ status: "generating" }).where(eq(schema.courses.id, courseId));
  const job = await enqueueJob("generate_outline", { ownerId: v.id, courseId, organizationId: course.organizationId, payload: { forceExtractive } });
  return job;
}

export async function saveOutline(v: Viewer, courseId: string, outline: OutlineInput) {
  const course = await loadEditableCourse(v, courseId);
  if (course.outlineStatus === "approved") throw new HttpError(409, "outline_already_approved");
  await db.update(schema.courses).set({ outline, outlineStatus: "proposed" }).where(eq(schema.courses.id, courseId));
}

/** Human approval gate: generation of lessons is impossible until this has been called by an editor. */
export async function approveOutline(v: Viewer, courseId: string) {
  const course = await loadEditableCourse(v, courseId);
  if (course.outlineStatus !== "proposed" || !course.outline) throw new HttpError(409, "no_outline_to_approve");
  if (course.status === "generating") throw new HttpError(409, "already_generating");
  const { forceExtractive } = await guardStudio(v.id).catch(limitToHttp);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.courses)
      .set({ outlineStatus: "approved", outlineApprovedAt: new Date(), outlineApprovedBy: v.id, status: "generating" })
      .where(eq(schema.courses.id, courseId));
    await tx.insert(schema.reviewDecisions).values({ courseId, reviewerId: v.id, decision: "outline_approved" });
  });
  await audit(v.id, "course.outline_approved", { type: "course", id: courseId }, {}, course.organizationId);
  return enqueueJob("generate_course", { ownerId: v.id, courseId, organizationId: course.organizationId, payload: { forceExtractive } });
}

export async function retryGeneration(v: Viewer, courseId: string) {
  const course = await loadEditableCourse(v, courseId);
  if (course.status === "generating") throw new HttpError(409, "already_generating");
  if (course.publishedVersionId) throw new HttpError(409, "already_published");
  const type = course.outlineStatus === "approved" ? "generate_course" : "generate_outline";
  await db.update(schema.courses).set({ status: "generating" }).where(eq(schema.courses.id, courseId));
  return enqueueJob(type, { ownerId: v.id, courseId, organizationId: course.organizationId });
}

async function lessonWithCourse(v: Viewer, lessonId: string) {
  const [l] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId));
  if (!l) throw new HttpError(404, "lesson_not_found");
  const course = await loadEditableCourse(v, l.courseId);
  if (course.status === "archived") throw new HttpError(409, "course_archived");
  return { lesson: l, course };
}

/** Educator edits apply to the working draft only. Learners keep reading the published version. */
export async function updateLesson(
  v: Viewer,
  lessonId: string,
  input: { title: string; objectives: string[]; contentMd: string; estimatedMinutes: number },
) {
  const { lesson, course } = await lessonWithCourse(v, lessonId);
  // Drop citations whose marker was removed by the edit.
  const markers = new Set([...input.contentMd.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  const citations = lesson.citations.filter((c) => markers.has(c.n));
  await db
    .update(schema.lessons)
    .set({ ...input, citations, origin: lesson.origin === "ai" ? "ai" : "human" })
    .where(eq(schema.lessons.id, lessonId));
  await db.update(schema.courses).set({ updatedAt: new Date() }).where(eq(schema.courses.id, course.id));
}

export async function updateQuestion(v: Viewer, questionId: string, input: { prompt: string; options: string[]; correctIndex: number; explanation: string }) {
  const [q] = await db
    .select({ id: schema.questions.id, courseId: schema.assessments.courseId })
    .from(schema.questions)
    .innerJoin(schema.assessments, eq(schema.assessments.id, schema.questions.assessmentId))
    .where(eq(schema.questions.id, questionId));
  if (!q) throw new HttpError(404, "question_not_found");
  await loadEditableCourse(v, q.courseId);
  await db.update(schema.questions).set(input).where(eq(schema.questions.id, questionId));
}

/** Ask AI for a revision. The result is stored as a proposal and never applied automatically. */
export async function proposeRevision(v: Viewer, lessonId: string, req: { operation: "simplify" | "shorten" | "key_points" | "custom"; instruction: string }) {
  const { lesson, course } = await lessonWithCourse(v, lessonId);
  const { forceExtractive } = await guardStudio(v.id).catch(limitToHttp);
  const docIds = await courseDocumentIds(course.id);
  const cited = new Set(lesson.citations.map((c) => c.chunkId));
  const chunks = (await chunksForDocuments(docIds, 200)).filter((c) => cited.has(c.id)).slice(0, 8);
  const out = await ai.revise(
    {
      instruction: req.instruction,
      operation: req.operation,
      content_md: lesson.contentMd,
      language: course.language,
      sources: chunks.map((c) => ({ id: c.id, filename: c.filename, heading: c.heading, content: c.content.slice(0, 7000), page: c.pageStart })),
    },
    { forceExtractive },
  );
  await recordUsage(out.usage, "revise", { userId: v.id, organizationId: course.organizationId });
  if (!out.applied) return { applied: false, note: out.note };
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const citations: Citation[] = out.citations.length
    ? out.citations.flatMap((c) => {
        const ch = byId.get(c.source_id);
        return ch ? [{ n: c.n, chunkId: ch.id, documentId: ch.documentId, filename: ch.filename, quote: c.quote, page: ch.pageStart }] : [];
      })
    : lesson.citations;
  await db
    .update(schema.lessons)
    .set({ proposedRevision: { instruction: req.instruction, contentMd: out.content_md, citations, createdAt: new Date().toISOString() } })
    .where(eq(schema.lessons.id, lessonId));
  return { applied: true, note: out.note };
}

export async function decideRevision(v: Viewer, lessonId: string, accept: boolean) {
  const { lesson, course } = await lessonWithCourse(v, lessonId);
  const p = lesson.proposedRevision;
  if (!p) throw new HttpError(409, "no_pending_revision");
  await db.transaction(async (tx) => {
    await tx
      .update(schema.lessons)
      .set(accept ? { contentMd: p.contentMd, citations: p.citations, proposedRevision: null } : { proposedRevision: null })
      .where(eq(schema.lessons.id, lessonId));
    await tx.insert(schema.reviewDecisions).values({ courseId: course.id, lessonId, reviewerId: v.id, decision: accept ? "revision_accepted" : "revision_rejected", notes: p.instruction });
  });
}

export async function buildSnapshot(course: Course): Promise<CourseSnapshot> {
  const [mods, lessonRows, assessmentRows, docIds] = await Promise.all([
    db.select().from(schema.modules).where(eq(schema.modules.courseId, course.id)).orderBy(asc(schema.modules.position)),
    db.select().from(schema.lessons).where(eq(schema.lessons.courseId, course.id)).orderBy(asc(schema.lessons.position)),
    db.select().from(schema.assessments).where(eq(schema.assessments.courseId, course.id)),
    courseDocumentIds(course.id),
  ]);
  const questionRows = assessmentRows.length
    ? await db.select().from(schema.questions).where(inArray(schema.questions.assessmentId, assessmentRows.map((a) => a.id))).orderBy(asc(schema.questions.position))
    : [];
  return {
    title: course.title,
    summary: course.summary,
    language: course.language,
    level: course.level,
    objectives: course.objectives,
    sourceDocumentIds: docIds,
    modules: mods.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      lessons: lessonRows
        .filter((l) => l.moduleId === m.id)
        .map((l) => {
          const a = assessmentRows.find((x) => x.lessonId === l.id);
          const qs = a ? questionRows.filter((q) => q.assessmentId === a.id) : [];
          return {
            id: l.id,
            title: l.title,
            objectives: l.objectives,
            contentMd: l.contentMd,
            citations: l.citations,
            estimatedMinutes: l.estimatedMinutes,
            flashcards: l.flashcards,
            quiz:
              a && qs.length
                ? {
                    id: a.id,
                    title: a.title,
                    passScore: a.passScore,
                    questions: qs.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, citation: q.citation ?? null })),
                  }
                : null,
          };
        }),
    })),
  };
}

export function snapshotProblems(s: CourseSnapshot): string[] {
  const problems: string[] = [];
  const lessons = s.modules.flatMap((m) => m.lessons);
  if (lessons.length === 0) problems.push("The course has no lessons.");
  for (const l of lessons) {
    if (l.contentMd.trim().length < 40) problems.push(`Lesson “${l.title}” has no content.`);
    for (const q of l.quiz?.questions ?? []) if (q.correctIndex >= q.options.length) problems.push(`A question in “${l.title}” has an invalid answer.`);
  }
  return problems;
}

/** Publishing is a deliberate human action that creates a new immutable version. */
export async function publishCourse(v: Viewer, courseId: string, changelog?: string) {
  const course = await loadEditableCourse(v, courseId);
  if (course.status === "generating") throw new HttpError(409, "still_generating");
  if (course.status === "archived") throw new HttpError(409, "course_archived");
  const pending = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .where(and(eq(schema.lessons.courseId, courseId), ne(schema.lessons.status, "ready")));
  if (pending.length) throw new HttpError(409, "lessons_not_ready", `${pending.length} lesson(s) are not ready.`);
  const snapshot = await buildSnapshot(course);
  const problems = snapshotProblems(snapshot);
  if (problems.length) throw new HttpError(400, "not_publishable", problems.join(" "));
  const version = await db.transaction(async (tx) => {
    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${schema.courseVersions.version}), 0) + 1` })
      .from(schema.courseVersions)
      .where(eq(schema.courseVersions.courseId, courseId));
    const [ver] = await tx
      .insert(schema.courseVersions)
      .values({ courseId, version: next, snapshot, changelog: changelog ?? null, publishedBy: v.id })
      .returning();
    await tx
      .update(schema.courses)
      .set({ status: "published", publishedVersionId: ver.id, publishedAt: new Date() })
      .where(eq(schema.courses.id, courseId));
    await tx.insert(schema.reviewDecisions).values({ courseId, courseVersionId: ver.id, reviewerId: v.id, decision: "publish_approved", notes: changelog });
    return ver;
  });
  await audit(v.id, "course.published", { type: "course", id: courseId }, { version: version.version }, course.organizationId);
  return version;
}

export async function archiveCourse(v: Viewer, courseId: string) {
  const course = await loadEditableCourse(v, courseId);
  await db.update(schema.courses).set({ status: "archived", archivedAt: new Date() }).where(eq(schema.courses.id, courseId));
  await db.insert(schema.reviewDecisions).values({ courseId, reviewerId: v.id, decision: "archived" });
  await audit(v.id, "course.archived", { type: "course", id: courseId }, {}, course.organizationId);
}

export async function updateCourseDetails(v: Viewer, courseId: string, input: { title: string; summary: string; audience: string }) {
  await loadEditableCourse(v, courseId);
  await db.update(schema.courses).set(input).where(eq(schema.courses.id, courseId));
}
