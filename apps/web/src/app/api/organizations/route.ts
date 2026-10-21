import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, HttpError, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { slugify } from "@/lib/utils";
import { audit } from "@/server/services/audit";
import { hitRateLimit } from "@/server/services/ai-guard";

const body = z.object({ name: z.string().trim().min(3).max(120), kind: z.enum(["school", "nonprofit", "other"]), description: z.string().trim().min(10).max(1000) });

/** Request a workspace. It stays "pending" until a platform administrator reviews it. */
export const POST = route(async (req) => {
  const v = await apiViewer();
  await hitRateLimit(`org-create:${v.id}`, 3, 86_400).catch(() => { throw new HttpError(429, "rate_limited"); });
  const b = body.parse(await req.json());
  const org = await db.transaction(async (tx) => {
    const [o] = await tx.insert(schema.organizations).values({ ...b, slug: `${slugify(b.name)}-${crypto.randomUUID().slice(0, 6)}`, createdBy: v.id }).returning();
    await tx.insert(schema.organizationMembers).values({ organizationId: o.id, userId: v.id, role: "owner" });
    return o;
  });
  await audit(v.id, "organization.requested", { type: "organization", id: org.id }, {}, org.id);
  return NextResponse.json({ id: org.id }, { status: 201 });
});
