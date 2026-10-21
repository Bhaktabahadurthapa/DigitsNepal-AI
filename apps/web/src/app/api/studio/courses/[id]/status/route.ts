import { NextResponse } from "next/server";
import { apiRole, route } from "@/server/authz";
import { getStudioCourse } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

/** Lightweight polling endpoint for job and source-processing progress. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  const s = await getStudioCourse(v, (await params).id);
  return NextResponse.json({
    status: s.course.status,
    outlineStatus: s.course.outlineStatus,
    sources: s.sources.map((d) => ({ id: d.id, status: d.status, error: d.error })),
    job: s.jobs[0] ? { id: s.jobs[0].id, type: s.jobs[0].type, status: s.jobs[0].status, progress: s.jobs[0].progress, message: s.jobs[0].message, error: s.jobs[0].error } : null,
  });
});
