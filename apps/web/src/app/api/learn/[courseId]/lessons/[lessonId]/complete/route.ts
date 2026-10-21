import { NextResponse } from "next/server";
import { apiViewer, route } from "@/server/authz";
import { completeLesson } from "@/server/services/learning";

type Ctx = { params: Promise<{ courseId: string; lessonId: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiViewer();
  const { courseId, lessonId } = await params;
  return NextResponse.json(await completeLesson(v, courseId, lessonId));
});
