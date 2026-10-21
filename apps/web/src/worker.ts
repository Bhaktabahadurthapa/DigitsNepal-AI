/**
 * Durable background worker. Run with `pnpm worker`. Any number of workers may run concurrently;
 * jobs are claimed with FOR UPDATE SKIP LOCKED.
 */
import "dotenv/config";
import { hostname } from "node:os";
import { pool } from "@/server/db";
import { log } from "@/server/log";
import { AiServiceError } from "@/server/services/ai-client";
import { handleExtract, handleGenerateCourse, handleOutline, onCourseJobFailed } from "@/server/services/generation";
import { claimNextJob, completeJob, failJob, type Job, JobCancelledError, NonRetryableError } from "@/server/services/jobs";

const WORKER_ID = `${hostname()}:${process.pid}`;
const IDLE_MS = Number(process.env.WORKER_POLL_MS ?? 1000);
let stopping = false;

const handlers: Record<Job["type"], (job: Job) => Promise<Record<string, unknown>>> = {
  extract_source: handleExtract,
  generate_outline: handleOutline,
  generate_course: handleGenerateCourse,
  revise_lesson: async () => {
    throw new NonRetryableError("revise_lesson runs synchronously, not as a job");
  },
};

async function runOne(): Promise<boolean> {
  const job = await claimNextJob(WORKER_ID);
  if (!job) return false;
  const t0 = Date.now();
  log.info("job.started", { jobId: job.id, type: job.type, attempt: job.attempts });
  try {
    const result = await handlers[job.type](job);
    await completeJob(job.id, result);
    log.info("job.completed", { jobId: job.id, type: job.type, ms: Date.now() - t0 });
  } catch (e) {
    if (e instanceof JobCancelledError) {
      log.info("job.cancelled", { jobId: job.id });
      await onCourseJobFailed(job);
      return true;
    }
    const retryable = !(e instanceof NonRetryableError) && !(e instanceof AiServiceError && !e.retryable);
    const message = e instanceof Error ? e.message : String(e);
    const willRetry = await failJob(job, message, retryable);
    log.warn("job.failed", { jobId: job.id, type: job.type, willRetry, error: message.slice(0, 300) });
    if (!willRetry) await onCourseJobFailed(job);
  }
  return true;
}

export async function drain(max = 100) {
  let n = 0;
  while (n < max && (await runOne())) n++;
  return n;
}

async function main() {
  log.info("worker.started", { workerId: WORKER_ID });
  while (!stopping) {
    try {
      const worked = await runOne();
      if (!worked) await new Promise((r) => setTimeout(r, IDLE_MS));
    } catch (e) {
      log.error("worker.loop_error", { error: String(e) });
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  await pool.end();
  log.info("worker.stopped", { workerId: WORKER_ID });
}

for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => (stopping = true));

if (process.argv[1]?.endsWith("worker.ts")) void main();
