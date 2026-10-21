import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { archiveCourse } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

/** Moderation: take a course out of the catalog. The reason is recorded in the audit log. */
export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await apiRole("admin");
  z.object({ reason: z.string().trim().min(5).max(500) }).parse(await req.json());
  await archiveCourse(admin, (await params).id);
  return NextResponse.json({ ok: true });
});
