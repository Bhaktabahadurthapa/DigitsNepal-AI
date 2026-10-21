import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await apiRole("admin");
  const { id } = await params;
  const { status } = z.object({ status: z.enum(["active", "suspended", "pending"]) }).parse(await req.json());
  await db.update(schema.organizations).set({ status }).where(eq(schema.organizations.id, id));
  await audit(admin.id, `organization.${status}`, { type: "organization", id }, {}, id);
  return NextResponse.json({ ok: true });
});
