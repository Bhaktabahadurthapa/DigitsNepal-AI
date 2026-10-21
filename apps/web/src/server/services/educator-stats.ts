import { and, eq, inArray, sql } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";

/** Aggregates for courses the viewer owns (admins: all). Minimal learner data: names and progress only. */
export async function educatorCourseStats(v: Viewer) {
  const owned = v.roles.includes("admin") ? undefined : eq(schema.courses.ownerId, v.id);
  const courses = await db
    .select({ id: schema.courses.id, title: schema.courses.title, status: schema.courses.status, language: schema.courses.language })
    .from(schema.courses)
    .where(and(owned, inArray(schema.courses.status, ["published", "in_review", "archived"])));
  const ids = courses.map((c) => c.id);
  if (!ids.length) return { courses: [], learners: [] };
  const enroll = await db
    .select({
      courseId: schema.enrollments.courseId,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${schema.enrollments.status} = 'completed')::int`,
    })
    .from(schema.enrollments)
    .where(inArray(schema.enrollments.courseId, ids))
    .groupBy(schema.enrollments.courseId);
  const quiz = await db
    .select({
      courseId: schema.enrollments.courseId,
      attempts: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(round(avg(${schema.quizAttempts.score})), 0)::int`,
      passRate: sql<number>`coalesce(round(100.0 * avg(case when ${schema.quizAttempts.passed} then 1 else 0 end)), 0)::int`,
    })
    .from(schema.quizAttempts)
    .innerJoin(schema.enrollments, eq(schema.enrollments.id, schema.quizAttempts.enrollmentId))
    .where(and(inArray(schema.enrollments.courseId, ids), eq(schema.quizAttempts.status, "submitted")))
    .groupBy(schema.enrollments.courseId);
  const learners = await db
    .select({
      courseId: schema.enrollments.courseId,
      name: schema.users.name,
      status: schema.enrollments.status,
      enrolledAt: schema.enrollments.enrolledAt,
      completedLessons: sql<number>`(select count(*)::int from progress p where p.enrollment_id = ${schema.enrollments.id} and p.status = 'completed')`,
    })
    .from(schema.enrollments)
    .innerJoin(schema.users, eq(schema.users.id, schema.enrollments.userId))
    .where(inArray(schema.enrollments.courseId, ids))
    .limit(500);
  return {
    courses: courses.map((c) => ({ ...c, ...(enroll.find((e) => e.courseId === c.id) ?? { total: 0, completed: 0 }), ...(quiz.find((q) => q.courseId === c.id) ?? { attempts: 0, avg: 0, passRate: 0 }) })),
    learners,
  };
}
