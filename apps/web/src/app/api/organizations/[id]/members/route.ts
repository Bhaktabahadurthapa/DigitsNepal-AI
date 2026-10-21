import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { requireOrgRole } from "@/server/services/access";
import { audit } from "@/server/services/audit";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ email: z.email(), role: z.enum(["admin", "reviewer", "member"]) });

/** Add an existing DigitsNepal account to the workspace. Only owners/admins may do this. */
export const POST = route<Ctx>(async (req, { params }) => {
  const v = await apiViewer();
  const { id } = await params;
  await requireOrgRole(v, id, ["owner", "admin"]);
  const { email, role } = body.parse(await req.json());
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email.toLowerCase()));
  // Same response whether or not the account exists, to avoid account enumeration.
  if (u) {
    await db.insert(schema.organizationMembers).values({ organizationId: id, userId: u.id, role }).onConflictDoNothing();
    await audit(v.id, "organization.member_added", { type: "user", id: u.id }, { role }, id);
  }
  if (!u) return NextResponse.json({ message: "If that person has an account, they have been added. Otherwise ask them to sign up first." }, { status: 202 });
  return NextResponse.json({ ok: true });
});
