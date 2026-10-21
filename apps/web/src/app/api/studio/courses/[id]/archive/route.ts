import { NextResponse } from "next/server";
import { apiRole, route } from "@/server/authz";
import { archiveCourse } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  await archiveCourse(v, (await params).id);
  return NextResponse.json({ ok: true });
});
