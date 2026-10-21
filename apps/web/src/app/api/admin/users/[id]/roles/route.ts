import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, HttpError, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ role: z.enum(["learner", "educator", "admin"]), grant: z.boolean() });

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await apiRole("admin");
  const { id } = await params;
  const { role, grant } = body.parse(await req.json());
  if (id === admin.id && role === "admin" && !grant) throw new HttpError(400, "cannot_remove_own_admin");
  if (grant) await db.insert(schema.roles).values({ userId: id, role, grantedBy: admin.id }).onConflictDoNothing();
  else await db.delete(schema.roles).where(and(eq(schema.roles.userId, id), eq(schema.roles.role, role)));
  if (role === "educator") await db.update(schema.profiles).set({ educatorStatus: grant ? "approved" : "none" }).where(eq(schema.profiles.userId, id));
  await audit(admin.id, grant ? "role.granted" : "role.revoked", { type: "user", id }, { role });
  return NextResponse.json({ ok: true });
});
