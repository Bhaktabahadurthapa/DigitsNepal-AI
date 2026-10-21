import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ consent: z.boolean(), note: z.string().trim().min(5).max(500) });

/** Record (or withdraw) guardian/educator consent for a learner under 18. The note documents how it was obtained. */
export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await apiRole("admin");
  const { id } = await params;
  const { consent, note } = body.parse(await req.json());
  await db.update(schema.profiles).set({ guardianConsentAt: consent ? new Date() : null }).where(eq(schema.profiles.userId, id));
  await audit(admin.id, consent ? "minor.consent_recorded" : "minor.consent_withdrawn", { type: "user", id }, { note });
  return NextResponse.json({ ok: true });
});
