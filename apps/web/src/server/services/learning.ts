import { and, desc, eq, gte } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import type { CourseSnapshot } from "@/server/db/schema";
import { HttpError } from "@/server/errors";
import { canViewPublishedCourse, catalogFilter, loadCourse } from "./access";

export const QUIZ_LOCK_MINUTES = 120;

export async function listCatalog(v: Viewer | null, opts: { language?: "en" | "ne"; includeComingSoon?: boolean } = {}) {
  const filter = await catalogFilter(v);
  const rows = await db
    .select({
      id: schema.courses.id,
      slug: schema.courses.slug,
      title: schema.courses.title,
      summary: schema.courses.summary,
      language: schema.courses.language,
      level: schema.courses.level,
      availability: schema.courses.availability,
      status: schema.courses.status,
      snapshot: schema.courseVersions.snapshot,
    })
    .from(schema.courses)
    .leftJoin(schema.courseVersions, eq(schema.courseVersions.id, schema.courses.publishedVersionId))
    .where(opts.language ? and(filter, eq(schema.courses.language, opts.language)) : filter)
    .orderBy(schema.courses.createdAt);
  const comingSoon = opts.includeComingSoon
    ? await db
        .select({ id: schema.courses.id, slug: schema.courses.slug, title: schema.courses.title, summary: schema.courses.summary, language: schema.courses.language, level: schema.courses.level, availability: schema.courses.availability, status: schema.courses.status })
        .from(schema.courses)
        .where(and(eq(schema.courses.availability, "coming_soon"), eq(schema.courses.visibility, "public")))
    : [];
  return [
    ...rows.map(({ snapshot, ...r }) => ({ ...r, lessonCount: snapshot?.modules.reduce((n, m) => n + m.lessons.length, 0) ?? 0, minutes: snapshot?.modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.estimatedMinutes, 0) ?? 0 })),
    ...comingSoon.map((r) => ({ ...r, lessonCount: 0, minutes: 0 })),
  ];
}

export async function getPublicCourse(v: Viewer | null, slug: string) {
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug));
  if (!course) return null;
  if (course.availability === "coming_soon") return { course, snapshot: null, enrollment: null };
  if (!(await canViewPublishedCourse(v, course))) return null;
  const [ver] = await db.select().from(schema.courseVersions).where(eq(schema.courseVersions.id, course.publishedVersionId!));
  const enrollment = v ? await getEnrollment(v.id, course.id) : null;
  return { course, snapshot: ver.snapshot, version: ver.version, enrollment };
}

export async function getEnrollment(userId: string, courseId: string) {
  const [e] = await db.select().from(schema.enrollments).where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)));
  return e ?? null;
}

export async function enroll(v: Viewer, courseId: string) {
  const course = await loadCourse(courseId);
  if (course.availability === "coming_soon" || !(await canViewPublishedCourse(v, course))) throw new HttpError(404, "course_not_found");
  const [e] = await db
    .insert(schema.enrollments)
    .values({ userId: v.id, courseId, courseVersionId: course.publishedVersionId! })
    .onConflictDoNothing()
    .returning();
  return e ?? (await getEnrollment(v.id, courseId))!;
}

function allLessons(s: CourseSnapshot) {
  return s.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));
}

/**
 * Load the player for an enrolled learner. The enrollment is moved to the newest published version;
 * progress is keyed by lesson id so it survives course updates.
 */
export async function getPlayer(v: Viewer, courseId: string) {
  const course = await loadCourse(courseId);
  const enrollment = await getEnrollment(v.id, courseId);
  if (!enrollment || !(await canViewPublishedCourse(v, course))) return null;
  if (course.publishedVersionId && enrollment.courseVersionId !== course.publishedVersionId) {
    await db.update(schema.enrollments).set({ courseVersionId: course.publishedVersionId }).where(eq(schema.enrollments.id, enrollment.id));
    enrollment.courseVersionId = course.publishedVersionId;
  }
  const [ver] = await db.select().from(schema.courseVersions).where(eq(schema.courseVersions.id, enrollment.courseVersionId));
  const prog = await db.select().from(schema.progress).where(eq(schema.progress.enrollmentId, enrollment.id));
  const attempts = await db
    .select()
    .from(schema.quizAttempts)
    .where(eq(schema.quizAttempts.enrollmentId, enrollment.id))
    .orderBy(desc(schema.quizAttempts.startedAt));
  return { course, snapshot: ver.snapshot, version: ver.version, enrollment, progress: prog, attempts };
}

export async function completeLesson(v: Viewer, courseId: string, lessonId: string) {
  const player = await getPlayer(v, courseId);
  if (!player) throw new HttpError(404, "not_enrolled");
  const lessons = allLessons(player.snapshot);
  if (!lessons.some((l) => l.id === lessonId)) throw new HttpError(404, "lesson_not_found");
  await db
    .insert(schema.progress)
    .values({ enrollmentId: player.enrollment.id, userId: v.id, lessonId, status: "completed", completedAt: new Date() })
    .onConflictDoUpdate({ target: [schema.progress.enrollmentId, schema.progress.lessonId], set: { status: "completed", completedAt: new Date() } });
  await db.update(schema.enrollments).set({ lastLessonId: lessonId }).where(eq(schema.enrollments.id, player.enrollment.id));
  const completedIds = new Set(
    (
      await db
        .select({ id: schema.progress.lessonId })
        .from(schema.progress)
        .where(and(eq(schema.progress.enrollmentId, player.enrollment.id), eq(schema.progress.status, "completed")))
    ).map((r) => r.id),
  );
  const courseDone = lessons.every((l) => completedIds.has(l.id));
  if (courseDone && player.enrollment.status !== "completed") {
    await db.update(schema.enrollments).set({ status: "completed", completedAt: new Date() }).where(eq(schema.enrollments.id, player.enrollment.id));
  }
  return { completedLessons: lessons.filter((l) => completedIds.has(l.id)).length, totalLessons: lessons.length, courseCompleted: courseDone };
}

export async function recordLessonVisit(v: Viewer, enrollmentId: string, lessonId: string) {
  await db.insert(schema.progress).values({ enrollmentId, userId: v.id, lessonId, status: "started" }).onConflictDoNothing();
  await db.update(schema.enrollments).set({ lastLessonId: lessonId }).where(and(eq(schema.enrollments.id, enrollmentId), eq(schema.enrollments.userId, v.id)));
}

export async function startQuiz(v: Viewer, courseId: string, lessonId: string) {
  const player = await getPlayer(v, courseId);
  if (!player) throw new HttpError(404, "not_enrolled");
  const lesson = allLessons(player.snapshot).find((l) => l.id === lessonId);
  if (!lesson?.quiz) throw new HttpError(404, "quiz_not_found");
  const open = player.attempts.find((a) => a.status === "in_progress" && a.assessmentId === lesson.quiz!.id);
  if (open) return open;
  const [a] = await db
    .insert(schema.quizAttempts)
    .values({ userId: v.id, enrollmentId: player.enrollment.id, assessmentId: lesson.quiz.id, lessonId, courseVersionId: player.enrollment.courseVersionId })
    .returning();
  return a;
}

/** Server-side grading against the exact course version the attempt was started on. */
export async function submitQuiz(v: Viewer, attemptId: string, answers: Record<string, number>) {
  const [attempt] = await db.select().from(schema.quizAttempts).where(and(eq(schema.quizAttempts.id, attemptId), eq(schema.quizAttempts.userId, v.id)));
  if (!attempt) throw new HttpError(404, "attempt_not_found");
  if (attempt.status === "submitted") throw new HttpError(409, "already_submitted");
  const [ver] = await db.select().from(schema.courseVersions).where(eq(schema.courseVersions.id, attempt.courseVersionId));
  const lesson = allLessons(ver.snapshot).find((l) => l.quiz?.id === attempt.assessmentId);
  if (!lesson?.quiz) throw new HttpError(404, "quiz_not_found");
  const results = lesson.quiz.questions.map((q) => ({
    questionId: q.id,
    selected: answers[q.id] ?? null,
    correctIndex: q.correctIndex,
    correct: answers[q.id] === q.correctIndex,
    explanation: q.explanation,
  }));
  const score = Math.round((100 * results.filter((r) => r.correct).length) / Math.max(1, results.length));
  const passed = score >= lesson.quiz.passScore;
  await db
    .update(schema.quizAttempts)
    .set({ status: "submitted", answers, score, passed, submittedAt: new Date() })
    .where(eq(schema.quizAttempts.id, attemptId));
  return { score, passed, passScore: lesson.quiz.passScore, results };
}

export async function hasOpenQuiz(userId: string, courseId: string) {
  const [r] = await db
    .select({ id: schema.quizAttempts.id })
    .from(schema.quizAttempts)
    .innerJoin(schema.enrollments, eq(schema.enrollments.id, schema.quizAttempts.enrollmentId))
    .where(
      and(
        eq(schema.quizAttempts.userId, userId),
        eq(schema.enrollments.courseId, courseId),
        eq(schema.quizAttempts.status, "in_progress"),
        gte(schema.quizAttempts.startedAt, new Date(Date.now() - QUIZ_LOCK_MINUTES * 60_000)),
      ),
    )
    .limit(1);
  return !!r;
}

export async function learnerDashboard(v: Viewer) {
  const enrollments = await db
    .select({ enrollment: schema.enrollments, course: schema.courses, snapshot: schema.courseVersions.snapshot })
    .from(schema.enrollments)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
    .innerJoin(schema.courseVersions, eq(schema.courseVersions.id, schema.enrollments.courseVersionId))
    .where(eq(schema.enrollments.userId, v.id))
    .orderBy(desc(schema.enrollments.enrolledAt));
  const prog = await db.select().from(schema.progress).where(and(eq(schema.progress.userId, v.id), eq(schema.progress.status, "completed")));
  const attempts = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, v.id), eq(schema.quizAttempts.status, "submitted")))
    .orderBy(desc(schema.quizAttempts.submittedAt))
    .limit(5);

  const courses = enrollments.map(({ enrollment, course, snapshot }) => {
    const lessons = allLessons(snapshot);
    const done = new Set(prog.filter((p) => p.enrollmentId === enrollment.id).map((p) => p.lessonId));
    const completed = lessons.filter((l) => done.has(l.id)).length;
    const next = lessons.find((l) => !done.has(l.id)) ?? null;
    return {
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      language: course.language,
      status: enrollment.status,
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((100 * completed) / lessons.length) : 0,
      nextLesson: next ? { id: next.id, title: next.title, moduleTitle: next.moduleTitle, minutes: next.estimatedMinutes } : null,
      lastLessonId: enrollment.lastLessonId,
      lessonTitles: new Map(lessons.map((l) => [l.id, l.title])),
    };
  });
  const lessonTitle = (id: string) => courses.map((c) => c.lessonTitles.get(id)).find(Boolean) ?? "Lesson";
  return {
    courses: courses.map(({ lessonTitles: _omit, ...c }) => c),
    completedLessons: prog.length,
    recentQuizzes: attempts.map((a) => ({ id: a.id, score: a.score ?? 0, passed: !!a.passed, lessonTitle: lessonTitle(a.lessonId), submittedAt: a.submittedAt })),
    continueCourse: courses.find((c) => c.status === "active" && c.nextLesson) ?? null,
  };
}
