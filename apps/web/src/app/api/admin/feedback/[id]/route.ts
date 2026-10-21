import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { apiRole, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const admin = await apiRole("admin");
  const { id } = await params;
  await db.update(schema.feedback).set({ status: "resolved" }).where(eq(schema.feedback.id, id));
  await audit(admin.id, "report.resolved", { type: "feedback", id });
  return NextResponse.json({ ok: true });
});
