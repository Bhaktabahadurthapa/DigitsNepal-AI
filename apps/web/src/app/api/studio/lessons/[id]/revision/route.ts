import { NextResponse } from "next/server";
import { revisionRequestSchema } from "@/lib/validation";
import { apiRole, route } from "@/server/authz";
import { proposeRevision } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  return NextResponse.json(await proposeRevision(v, (await params).id, revisionRequestSchema.parse(await req.json())));
});
