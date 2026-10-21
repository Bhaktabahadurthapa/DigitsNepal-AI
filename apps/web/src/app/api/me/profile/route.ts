import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, route } from "@/server/authz";
import { db, schema } from "@/server/db";

const patch = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  preferredLanguage: z.enum(["en", "ne"]).optional(),
  // A learner may declare themselves a minor, but may not clear it or self-consent.
  isMinor: z.literal(true).optional(),
});

export const PATCH = route(async (req) => {
  const v = await apiViewer();
  const b = patch.parse(await req.json());
  await db.update(schema.profiles).set(b).where(eq(schema.profiles.userId, v.id));
  return NextResponse.json({ ok: true });
});
