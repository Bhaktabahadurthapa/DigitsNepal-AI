import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, HttpError, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { hitRateLimit } from "@/server/services/ai-guard";

const body = z.object({ courseId: z.uuid().optional(), kind: z.enum(["abuse_report", "general"]), comment: z.string().trim().min(5).max(2000) });

/** Learners can report harmful or incorrect content; admins review in /admin/reports. */
export const POST = route(async (req) => {
  const v = await apiViewer();
  await hitRateLimit(`report:${v.id}`, 10, 3600).catch(() => {
    throw new HttpError(429, "rate_limited");
  });
  const b = body.parse(await req.json());
  await db.insert(schema.feedback).values({ userId: v.id, kind: b.kind, courseId: b.courseId, comment: b.comment });
  return NextResponse.json({ ok: true }, { status: 201 });
});
