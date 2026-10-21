import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { publishCourse } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ changelog: z.string().trim().max(500).optional(), confirm: z.literal(true) });

export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  const { changelog } = body.parse(await req.json());
  const ver = await publishCourse(v, (await params).id, changelog);
  return NextResponse.json({ version: ver.version });
});
