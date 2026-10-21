import { NextResponse } from "next/server";
import { apiViewer, route } from "@/server/authz";
import { enroll } from "@/server/services/learning";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiViewer();
  const { id } = await params;
  const e = await enroll(v, id);
  return NextResponse.json({ enrollmentId: e.id });
});
