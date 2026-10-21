import { db, schema } from "@/server/db";

export async function audit(
  actorId: string | null,
  action: string,
  target?: { type: string; id: string },
  metadata: Record<string, unknown> = {},
  organizationId?: string | null,
) {
  await db.insert(schema.auditEvents).values({
    actorId,
    action,
    targetType: target?.type,
    targetId: target?.id,
    metadata,
    organizationId: organizationId ?? null,
  });
}
