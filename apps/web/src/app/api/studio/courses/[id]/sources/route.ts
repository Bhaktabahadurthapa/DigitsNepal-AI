import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { attachDocument, detachDocument } from "@/server/services/courses";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ documentId: z.uuid() });

export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await attachDocument(v, (await params).id, body.parse(await req.json()).documentId);
  return NextResponse.json({ ok: true });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const v = await apiRole("educator");
  await detachDocument(v, (await params).id, body.parse(await req.json()).documentId);
  return NextResponse.json({ ok: true });
});
