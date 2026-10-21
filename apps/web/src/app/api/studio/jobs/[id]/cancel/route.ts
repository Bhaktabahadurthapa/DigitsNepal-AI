import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiRole, HttpError, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { loadEditableCourse } from "@/server/services/access";
import { onCourseJobFailed } from "@/server/services/generation";
import { cancelJob } from "@/server/services/jobs";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  const { id } = await params;
  const [job] = await db.select().from(schema.generationJobs).where(and(eq(schema.generationJobs.id, id)));
  if (!job?.courseId) throw new HttpError(404, "job_not_found");
  await loadEditableCourse(v, job.courseId);
  const cancelled = await cancelJob(id);
  if (!cancelled) throw new HttpError(409, "job_not_cancellable");
  await onCourseJobFailed(cancelled);
  return NextResponse.json({ ok: true });
});
