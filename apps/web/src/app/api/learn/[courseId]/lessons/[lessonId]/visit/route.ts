import { NextResponse } from "next/server";
import { apiViewer, HttpError, route } from "@/server/authz";
import { getEnrollment, recordLessonVisit } from "@/server/services/learning";

type Ctx = { params: Promise<{ courseId: string; lessonId: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiViewer();
  const { courseId, lessonId } = await params;
  const e = await getEnrollment(v.id, courseId);
  if (!e) throw new HttpError(404, "not_enrolled");
  await recordLessonVisit(v, e.id, lessonId);
  return NextResponse.json({ ok: true });
});
