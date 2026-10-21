import { NextResponse } from "next/server";
import { apiViewer, route } from "@/server/authz";
import { startQuiz } from "@/server/services/learning";

type Ctx = { params: Promise<{ courseId: string; lessonId: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiViewer();
  const { courseId, lessonId } = await params;
  const a = await startQuiz(v, courseId, lessonId);
  return NextResponse.json({ attemptId: a.id });
});
