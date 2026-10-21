import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, HttpError, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

const body = z.object({ statement: z.string().trim().min(20).max(1500) });

export const POST = route(async (req) => {
  const v = await apiViewer();
  if (v.educatorStatus === "approved" || v.roles.includes("educator")) throw new HttpError(409, "already_educator");
  const { statement } = body.parse(await req.json());
  await db.update(schema.profiles).set({ educatorStatus: "pending", educatorStatement: statement }).where(eq(schema.profiles.userId, v.id));
  await audit(v.id, "educator.requested", { type: "user", id: v.id });
  return NextResponse.json({ ok: true });
});
