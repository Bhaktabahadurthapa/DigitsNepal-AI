/** Small DB operations used by E2E tests to simulate states that are hard to trigger from the UI. */
import { eq } from "drizzle-orm";
import { db, pool, schema } from "@/server/db";

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "fail-outline") {
    const [c] = await db.select().from(schema.courses).where(eq(schema.courses.id, arg));
    await db.update(schema.courses).set({ status: "draft" }).where(eq(schema.courses.id, arg));
    await db.insert(schema.generationJobs).values({ type: "generate_outline", status: "failed", ownerId: c.ownerId, courseId: arg, attempts: 3, error: "AI service 502: provider_error (simulated outage)", finishedAt: new Date() });
  }
  if (cmd === "answers") {
    // Print the correct answer indexes of the first lesson quiz of a course's published version.
    const [c] = await db.select().from(schema.courses).where(eq(schema.courses.slug, arg));
    const [v] = await db.select().from(schema.courseVersions).where(eq(schema.courseVersions.id, c.publishedVersionId!));
    console.log(JSON.stringify(v.snapshot.modules[0].lessons[0].quiz?.questions.map((q) => q.correctIndex) ?? []));
  }
  await pool.end();
}
void main();
