import { NextResponse } from "next/server";
import { outlineSchema } from "@/lib/validation";
import { apiRole, route } from "@/server/authz";
import { requestOutline, saveOutline } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };

/** Ask AI to propose an outline from the course's processed sources. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  const job = await requestOutline(v, (await params).id);
  return NextResponse.json({ jobId: job.id }, { status: 202 });
});

/** Save the educator's edits to the proposed outline. */
export const PUT = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await saveOutline(v, (await params).id, outlineSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
