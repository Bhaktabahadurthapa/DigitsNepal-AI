import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { getStudioCourse, updateCourseDetails } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  return NextResponse.json(await getStudioCourse(v, (await params).id));
});

const details = z.object({ title: z.string().trim().min(3).max(140), summary: z.string().trim().max(600), audience: z.string().trim().max(300) });

export const PATCH = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await updateCourseDetails(v, (await params).id, details.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
