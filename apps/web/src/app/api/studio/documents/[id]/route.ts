import { NextResponse } from "next/server";
import { apiRole, route } from "@/server/authz";
import { deleteDocument } from "@/server/services/library";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const v = await apiRole("educator");
  await deleteDocument(v, (await params).id);
  return NextResponse.json({ ok: true });
});
