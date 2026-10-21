import { NextResponse } from "next/server";
import { lessonUpdateSchema } from "@/lib/validation";
import { apiRole, route } from "@/server/authz";
import { updateLesson } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await updateLesson(v, (await params).id, lessonUpdateSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
