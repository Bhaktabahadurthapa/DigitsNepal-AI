import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import { HttpError } from "@/server/errors";
import { budgetState, guardTutor, hitRateLimit, LimitError, recordUsage } from "@/server/services/ai-guard";
import { approveOutline, createCourse, publishCourse, requestOutline, updateLesson } from "@/server/services/courses";
import { handleGenerateCourse } from "@/server/services/generation";
import { claimNextJob, enqueueJob, failJob, NonRetryableError } from "@/server/services/jobs";
import { makeDoc, makePublishedCourse, makeUser, resetDb } from "./helpers";

let edu: Viewer;
beforeAll(async () => {
  await resetDb();
  edu = await makeUser("Edu", ["learner", "educator"]);
});

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof HttpError ? `${e.status}:${e.code}` : (e as Error).constructor.name;
  }
};

describe("human approval gates", () => {
  it("outline generation requires processed sources", async () => {
    const c = await createCourse(edu, { learningType: "course", title: "No sources", audience: "", language: "en", level: "beginner", objectives: [], visibility: "public" });
    expect(await code(requestOutline(edu, c.id))).toBe("400:no_sources");
    const d = await makeDoc(edu, null, []);
    await db.update(schema.sourceDocuments).set({ status: "processing" }).where(eq(schema.sourceDocuments.id, d.id));
    await db.insert(schema.courseSources).values({ courseId: c.id, documentId: d.id });
    expect(await code(requestOutline(edu, c.id))).toBe("409:sources_not_ready");
  });

  it("lesson generation refuses to run without educator approval", async () => {
    const c = await createCourse(edu, { learningType: "course", title: "Unapproved", audience: "", language: "en", level: "beginner", objectives: [], visibility: "public" });
    await db.update(schema.courses).set({ outline: { modules: [{ title: "M", lessons: [{ title: "L", objectives: [] }] }] }, outlineStatus: "proposed" }).where(eq(schema.courses.id, c.id));
    const job = await enqueueJob("generate_course", { ownerId: edu.id, courseId: c.id });
    await expect(handleGenerateCourse(job)).rejects.toBeInstanceOf(NonRetryableError);
    expect(await code(approveOutline(await makeUser("Other", ["educator"]), c.id))).toBe("404:course_not_found");
  });

  it("published versions are immutable; edits only affect the draft", async () => {
    const { course, lesson } = await makePublishedCourse(edu);
    await updateLesson(edu, lesson.id, { title: "Edited title", objectives: [], contentMd: "Changed content that is long enough to publish later.", estimatedMinutes: 3 });
    const [v1] = await db.select().from(schema.courseVersions).where(eq(schema.courseVersions.courseId, course.id));
    expect(v1.snapshot.modules[0].lessons[0].title).toBe("Lesson one");
    const v2 = await publishCourse(edu, course.id, "edit");
    expect(v2.version).toBe(2);
    expect(v2.snapshot.modules[0].lessons[0].title).toBe("Edited title");
  });

  it("publishing is refused while lessons are not ready", async () => {
    const { course, lesson } = await makePublishedCourse(edu);
    await db.update(schema.lessons).set({ status: "failed" }).where(eq(schema.lessons.id, lesson.id));
    expect(await code(publishCourse(edu, course.id))).toBe("409:lessons_not_ready");
  });
});

describe("durable jobs", () => {
  it("concurrent workers never claim the same job", async () => {
    await db.delete(schema.generationJobs);
    for (let i = 0; i < 5; i++) await enqueueJob("extract_source", { ownerId: edu.id });
    const claimed = await Promise.all(Array.from({ length: 8 }, (_, i) => claimNextJob(`w${i}`)));
    const ids = claimed.filter(Boolean).map((j) => j!.id);
    expect(ids.length).toBe(5);
    expect(new Set(ids).size).toBe(5);
  });

  it("retries retryable failures then fails permanently", async () => {
    await db.delete(schema.generationJobs);
    await enqueueJob("extract_source", { ownerId: edu.id, maxAttempts: 2 });
    let job = (await claimNextJob("w"))!;
    expect(await failJob(job, "timeout", true)).toBe(true);
    await db.update(schema.generationJobs).set({ runAfter: new Date(0) }).where(eq(schema.generationJobs.id, job.id));
    job = (await claimNextJob("w"))!;
    expect(job.attempts).toBe(2);
    expect(await failJob(job, "timeout", true)).toBe(false);
    const [row] = await db.select().from(schema.generationJobs).where(eq(schema.generationJobs.id, job.id));
    expect(row.status).toBe("failed");
  });
});

describe("AI cost controls", () => {
  it("rate limits per window", async () => {
    const key = `t:${crypto.randomUUID()}`;
    await hitRateLimit(key, 2, 60);
    await hitRateLimit(key, 2, 60);
    await expect(hitRateLimit(key, 2, 60)).rejects.toBeInstanceOf(LimitError);
  });

  it("degrades to the free extractive provider when the monthly budget is exhausted", async () => {
    await db.insert(schema.systemSettings).values({ key: "ai_limits", value: { monthlyBudgetUsd: 0.01 } }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: { monthlyBudgetUsd: 0.01 } } });
    await recordUsage({ provider: "gemini", model: "x", tokens_in: 1, tokens_out: 1, cost_usd: 0.02, latency_ms: 1 }, "tutor", { userId: null });
    expect((await budgetState()).exhausted).toBe(true);
    const u = await makeUser("Budget learner");
    expect((await guardTutor(u.id)).forceExtractive).toBe(true);
    await db.delete(schema.systemSettings);
  });

  it("enforces the per-user daily tutor limit", async () => {
    await db.insert(schema.systemSettings).values({ key: "ai_limits", value: { tutorDailyPerUser: 1 } });
    const u = await makeUser("Daily");
    await recordUsage({ provider: "extractive", model: "x", tokens_in: 1, tokens_out: 1, cost_usd: 0, latency_ms: 1 }, "tutor", { userId: u.id });
    await expect(guardTutor(u.id)).rejects.toMatchObject({ code: "daily_limit" });
    await db.delete(schema.systemSettings);
  });
});
