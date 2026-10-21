import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRole, route } from "@/server/authz";
import { db, schema } from "@/server/db";
import { audit } from "@/server/services/audit";

const limits = z.object({
  monthlyBudgetUsd: z.number().min(0).max(10_000),
  softLimitRatio: z.number().min(0.1).max(1),
  tutorDailyPerUser: z.number().int().min(0).max(1000),
  tutorPerMinutePerUser: z.number().int().min(1).max(60),
  studioDailyPerUser: z.number().int().min(0).max(200),
  tutorEnabled: z.boolean(),
  studioEnabled: z.boolean(),
});

export const PUT = route(async (req) => {
  const admin = await apiRole("admin");
  const value = limits.parse(await req.json());
  await db
    .insert(schema.systemSettings)
    .values({ key: "ai_limits", value, updatedBy: admin.id })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value, updatedBy: admin.id, updatedAt: new Date() } });
  await audit(admin.id, "settings.ai_limits_updated", { type: "setting", id: "ai_limits" }, value);
  return NextResponse.json({ ok: true });
});
