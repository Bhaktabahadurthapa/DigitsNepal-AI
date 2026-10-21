import { NextResponse } from "next/server";
import { quizSubmitSchema } from "@/lib/validation";
import { apiViewer, route } from "@/server/authz";
import { submitQuiz } from "@/server/services/learning";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiViewer();
  const { id } = await params;
  const { answers } = quizSubmitSchema.parse(await req.json());
  return NextResponse.json(await submitQuiz(v, id, answers));
});
