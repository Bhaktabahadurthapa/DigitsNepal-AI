import { NextResponse } from "next/server";
import { apiRole, route } from "@/server/authz";
import { approveOutline } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  const job = await approveOutline(v, (await params).id);
  return NextResponse.json({ jobId: job.id }, { status: 202 });
});
