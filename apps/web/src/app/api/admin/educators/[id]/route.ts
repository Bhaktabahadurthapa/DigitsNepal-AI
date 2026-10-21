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
  const { approve } = z.object({ approve: z.boolean() }).parse(await req.json());
  await db.update(schema.profiles).set({ educatorStatus: approve ? "approved" : "rejected" }).where(eq(schema.profiles.userId, id));
  if (approve) await db.insert(schema.roles).values({ userId: id, role: "educator", grantedBy: admin.id }).onConflictDoNothing();
  await audit(admin.id, approve ? "educator.approved" : "educator.rejected", { type: "user", id });
  return NextResponse.json({ ok: true });
});
