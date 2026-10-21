import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

export type JobType = (typeof schema.jobTypeEnum.enumValues)[number];
export type Job = typeof schema.generationJobs.$inferSelect;

export class NonRetryableError extends Error {}
export class JobCancelledError extends Error {}

export async function enqueueJob(
  type: JobType,
  args: { ownerId: string; courseId?: string; documentId?: string; organizationId?: string | null; payload?: Record<string, unknown>; maxAttempts?: number },
) {
  const [job] = await db
    .insert(schema.generationJobs)
    .values({
      type,
      ownerId: args.ownerId,
      courseId: args.courseId,
      documentId: args.documentId,
      organizationId: args.organizationId ?? null,
      payload: args.payload ?? {},
      maxAttempts: args.maxAttempts ?? 3,
    })
    .returning();
  return job;
}

const STALE_MINUTES = 10;

/** Atomically claim the oldest runnable job. Safe with many workers (FOR UPDATE SKIP LOCKED). */
export async function claimNextJob(workerId: string): Promise<Job | null> {
  // Recover jobs whose worker died mid-run.
  await db
    .update(schema.generationJobs)
    .set({ status: "pending", lockedAt: null, lockedBy: null, message: "Recovered after worker timeout" })
    .where(and(eq(schema.generationJobs.status, "running"), lt(schema.generationJobs.lockedAt, sql`now() - interval '${sql.raw(String(STALE_MINUTES))} minutes'`)));

  const rows = await db.execute<{ id: string }>(sql`
    UPDATE generation_jobs SET status = 'running', locked_at = now(), locked_by = ${workerId},
      attempts = attempts + 1, started_at = coalesce(started_at, now()), error = null
    WHERE id = (
      SELECT id FROM generation_jobs
      WHERE status = 'pending' AND run_after <= now()
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id`);
  const id = rows.rows[0]?.id;
  if (!id) return null;
  const [job] = await db.select().from(schema.generationJobs).where(eq(schema.generationJobs.id, id));
  return job ?? null;
}

export async function setJobProgress(id: string, progress: number, message?: string) {
  const [j] = await db
    .update(schema.generationJobs)
    .set({ progress: Math.round(progress), message })
    .where(eq(schema.generationJobs.id, id))
    .returning({ status: schema.generationJobs.status });
  if (j?.status === "cancelled") throw new JobCancelledError();
}

export async function addJobUsage(id: string, tokensIn: number, tokensOut: number, costUsd: number) {
  await db
    .update(schema.generationJobs)
    .set({
      tokensIn: sql`${schema.generationJobs.tokensIn} + ${tokensIn}`,
      tokensOut: sql`${schema.generationJobs.tokensOut} + ${tokensOut}`,
      costUsd: sql`${schema.generationJobs.costUsd} + ${costUsd.toFixed(6)}`,
    })
    .where(eq(schema.generationJobs.id, id));
}

export async function completeJob(id: string, result: Record<string, unknown> = {}) {
  await db
    .update(schema.generationJobs)
    .set({ status: "completed", progress: 100, result, finishedAt: new Date(), lockedAt: null, lockedBy: null })
    .where(and(eq(schema.generationJobs.id, id), eq(schema.generationJobs.status, "running")));
}

/** Returns true when the job will be retried. */
export async function failJob(job: Job, error: string, retryable: boolean): Promise<boolean> {
  const retry = retryable && job.attempts < job.maxAttempts;
  const backoffSec = Math.min(300, 15 * 2 ** (job.attempts - 1));
  await db
    .update(schema.generationJobs)
    .set(
      retry
        ? { status: "pending", error: error.slice(0, 1000), message: `Retrying (attempt ${job.attempts + 1} of ${job.maxAttempts})`, runAfter: new Date(Date.now() + backoffSec * 1000), lockedAt: null, lockedBy: null }
        : { status: "failed", error: error.slice(0, 1000), finishedAt: new Date(), lockedAt: null, lockedBy: null },
    )
    .where(and(eq(schema.generationJobs.id, job.id), eq(schema.generationJobs.status, "running")));
  return retry;
}

export async function cancelJob(id: string) {
  const [j] = await db
    .update(schema.generationJobs)
    .set({ status: "cancelled", finishedAt: new Date(), message: "Cancelled by user" })
    .where(and(eq(schema.generationJobs.id, id), inArray(schema.generationJobs.status, ["pending", "running"])))
    .returning();
  return j ?? null;
}

export async function retryJob(id: string) {
  const [j] = await db
    .update(schema.generationJobs)
    .set({ status: "pending", attempts: 0, error: null, runAfter: new Date(), finishedAt: null, message: "Retry requested" })
    .where(and(eq(schema.generationJobs.id, id), inArray(schema.generationJobs.status, ["failed", "cancelled"])))
    .returning();
  return j ?? null;
}
