/**
 * Idempotent seed: system user + curated Academy courses (published as version 1).
 * Optional demo accounts (development only): SEED_DEMO_USERS=1 pnpm db:seed
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool, schema } from "../src/server/db";
import { buildSnapshot } from "../src/server/services/courses";
import { notices, seedCourses } from "./seed-content";

const SYSTEM_USER_ID = "system-digitsnepal";

async function ensureSystemUser() {
  await db
    .insert(schema.users)
    .values({ id: SYSTEM_USER_ID, name: "DigitsNepal Team", email: "team@digitsnepal.invalid", emailVerified: true })
    .onConflictDoNothing();
  await db.insert(schema.profiles).values({ userId: SYSTEM_USER_ID, displayName: "DigitsNepal Team", educatorStatus: "approved" }).onConflictDoNothing();
  await db.insert(schema.roles).values({ userId: SYSTEM_USER_ID, role: "educator" }).onConflictDoNothing();
}

async function seedCourse(c: (typeof seedCourses)[number]) {
  const [existing] = await db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.slug, c.slug));
  if (existing) return "exists";
  const [course] = await db
    .insert(schema.courses)
    .values({
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      language: c.language,
      level: c.level,
      audience: c.audience,
      objectives: c.objectives,
      availability: c.availability,
      notice: notices[c.language],
      ownerId: SYSTEM_USER_ID,
      visibility: "public",
      status: c.availability === "available" ? "in_review" : "draft",
      outlineStatus: "approved",
    })
    .returning();
  if (c.availability !== "available") return "coming_soon";

  let lessonPos = 0;
  for (const [mi, m] of c.modules.entries()) {
    const [mod] = await db.insert(schema.modules).values({ courseId: course.id, position: mi, title: m.title, summary: m.summary }).returning();
    for (const l of m.lessons) {
      const [lesson] = await db
        .insert(schema.lessons)
        .values({ courseId: course.id, moduleId: mod.id, position: lessonPos++, title: l.title, objectives: l.objectives, contentMd: l.contentMd, estimatedMinutes: l.minutes, flashcards: l.flashcards ?? [], origin: "seed", status: "ready" })
        .returning();
      const [a] = await db.insert(schema.assessments).values({ courseId: course.id, lessonId: lesson.id, title: `Quiz: ${l.title}` }).returning();
      await db.insert(schema.questions).values(l.quiz.map((q, i) => ({ assessmentId: a.id, position: i, ...q })));
    }
  }
  const snapshot = await buildSnapshot(course);
  const [ver] = await db.insert(schema.courseVersions).values({ courseId: course.id, version: 1, snapshot, changelog: "Initial starter version", publishedBy: SYSTEM_USER_ID }).returning();
  await db.update(schema.courses).set({ status: "published", publishedVersionId: ver.id, publishedAt: new Date() }).where(eq(schema.courses.id, course.id));
  return "published";
}

async function seedDemoUsers() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to create demo users in production");
  const { auth } = await import("../src/server/auth");
  const demo = [
    { email: "learner@demo.digitsnepal.local", name: "Demo Learner", educator: false },
    { email: "educator@demo.digitsnepal.local", name: "Demo Educator", educator: true },
  ];
  const password = process.env.SEED_DEMO_PASSWORD ?? "demo-password-123";
  for (const d of demo) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.email, d.email));
    const userId = u?.id ?? (await auth.api.signUpEmail({ body: { email: d.email, password, name: d.name } })).user.id;
    if (d.educator) {
      await db.insert(schema.roles).values({ userId, role: "educator" }).onConflictDoNothing();
      await db.update(schema.profiles).set({ educatorStatus: "approved" }).where(eq(schema.profiles.userId, userId));
    }
    console.log(`demo user: ${d.email}`);
  }
}

async function main() {
  await ensureSystemUser();
  for (const c of seedCourses) console.log(`${c.slug}: ${await seedCourse(c)}`);
  if (process.env.SEED_DEMO_USERS === "1") await seedDemoUsers();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
