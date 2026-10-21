import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { decideRevision } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  const { accept } = z.object({ accept: z.boolean() }).parse(await req.json());
  await decideRevision(v, (await params).id, accept);
  return NextResponse.json({ ok: true });
});
