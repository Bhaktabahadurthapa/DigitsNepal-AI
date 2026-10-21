import { sql } from "drizzle-orm";
import { type Viewer, loadViewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import type { CourseSnapshot } from "@/server/db/schema";

export async function resetDb() {
  const tables = await db.execute<{ tablename: string }>(sql`select tablename from pg_tables where schemaname = 'public'`);
  const names = tables.rows.map((r) => `"${r.tablename}"`).join(", ");
  if (names) await db.execute(sql.raw(`TRUNCATE ${names} RESTART IDENTITY CASCADE`));
}

export async function makeUser(name: string, roles: ("learner" | "educator" | "admin")[] = ["learner"], opts: { isMinor?: boolean; mfa?: boolean } = {}): Promise<Viewer> {
  const id = crypto.randomUUID();
  await db.insert(schema.users).values({ id, name, email: `${name.toLowerCase().replace(/\W/g, "")}-${id.slice(0, 6)}@test.local`, twoFactorEnabled: !!opts.mfa });
  await db.insert(schema.profiles).values({ userId: id, displayName: name, isMinor: !!opts.isMinor });
  await db.insert(schema.roles).values(roles.map((role) => ({ userId: id, role })));
  return (await loadViewer(id))!;
}

export async function makeOrg(name: string, owner: Viewer, status: "active" | "pending" | "suspended" = "active") {
  const [o] = await db.insert(schema.organizations).values({ name, slug: `${name}-${crypto.randomUUID().slice(0, 6)}`, status, createdBy: owner.id }).returning();
  await db.insert(schema.organizationMembers).values({ organizationId: o.id, userId: owner.id, role: "owner" });
  return o;
}

export async function addMember(orgId: string, v: Viewer, role: "admin" | "reviewer" | "member") {
  await db.insert(schema.organizationMembers).values({ organizationId: orgId, userId: v.id, role });
}

export function vec(hot: number[]): number[] {
  const v = new Array(768).fill(0);
  for (const i of hot) v[i] = 1;
  const n = Math.sqrt(hot.length) || 1;
  return v.map((x) => x / n);
}

export async function makeDoc(owner: Viewer, organizationId: string | null, chunks: { content: string; hot: number[] }[]) {
  const [d] = await db
    .insert(schema.sourceDocuments)
    .values({ ownerId: owner.id, organizationId, filename: `doc-${crypto.randomUUID().slice(0, 4)}.txt`, mimeType: "text/plain", sizeBytes: 10, sha256: "x", storageKey: "none", status: "ready", rightsConfirmed: true })
    .returning();
  if (chunks.length) await db.insert(schema.sourceChunks).values(chunks.map((c, i) => ({ documentId: d.id, ordinal: i, content: c.content, embedding: vec(c.hot) })));
  return d;
}

/** Create a published course with one lesson + one 2-question quiz, directly in the database. */
export async function makePublishedCourse(owner: Viewer, opts: { organizationId?: string | null; visibility?: "public" | "organization" | "private"; docIds?: string[] } = {}) {
  const [c] = await db
    .insert(schema.courses)
    .values({ slug: `c-${crypto.randomUUID().slice(0, 8)}`, title: "Test course", ownerId: owner.id, organizationId: opts.organizationId ?? null, visibility: opts.visibility ?? "public", status: "in_review", outlineStatus: "approved" })
    .returning();
  const [m] = await db.insert(schema.modules).values({ courseId: c.id, position: 0, title: "Module" }).returning();
  const [l] = await db.insert(schema.lessons).values({ courseId: c.id, moduleId: m.id, position: 0, title: "Lesson one", contentMd: "Solar panels turn sunlight into electricity using photovoltaic cells. ".repeat(3), status: "ready" }).returning();
  const [a] = await db.insert(schema.assessments).values({ courseId: c.id, lessonId: l.id, title: "Quiz" }).returning();
  const [q1, q2] = await db
    .insert(schema.questions)
    .values([
      { assessmentId: a.id, position: 0, prompt: "Q1?", options: ["a", "b"], correctIndex: 1, explanation: "b" },
      { assessmentId: a.id, position: 1, prompt: "Q2?", options: ["a", "b"], correctIndex: 0, explanation: "a" },
    ])
    .returning();
  for (const d of opts.docIds ?? []) await db.insert(schema.courseSources).values({ courseId: c.id, documentId: d });
  const { buildSnapshot } = await import("@/server/services/courses");
  const snapshot: CourseSnapshot = await buildSnapshot(c);
  const [ver] = await db.insert(schema.courseVersions).values({ courseId: c.id, version: 1, snapshot }).returning();
  await db.update(schema.courses).set({ status: "published", publishedVersionId: ver.id }).where(sql`id = ${c.id}`);
  return { course: { ...c, status: "published" as const, publishedVersionId: ver.id }, lesson: l, quizId: a.id, questions: [q1, q2] };
}
