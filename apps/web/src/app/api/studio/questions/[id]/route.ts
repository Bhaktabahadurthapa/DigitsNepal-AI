import { NextResponse } from "next/server";
import { questionUpdateSchema } from "@/lib/validation";
import { apiRole, route } from "@/server/authz";
import { updateQuestion } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await updateQuestion(v, (await params).id, questionUpdateSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
