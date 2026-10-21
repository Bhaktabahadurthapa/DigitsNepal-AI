import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { log } from "@/server/log";
import type { AiUsage } from "./ai-client";

export type AiLimits = {
  monthlyBudgetUsd: number;
  softLimitRatio: number;
  tutorDailyPerUser: number;
  tutorPerMinutePerUser: number;
  studioDailyPerUser: number;
  tutorEnabled: boolean;
  studioEnabled: boolean;
};

export class LimitError extends Error {
  constructor(public code: "ai_budget_exhausted" | "daily_limit" | "rate_limited" | "feature_disabled" | "consent_required") {
    super(code);
  }
}

export async function getLimits(): Promise<AiLimits> {
  const env: AiLimits = {
    monthlyBudgetUsd: Number(process.env.AI_MONTHLY_BUDGET_USD ?? 40),
    softLimitRatio: Number(process.env.AI_MONTHLY_SOFT_LIMIT_RATIO ?? 0.8),
    tutorDailyPerUser: Number(process.env.AI_TUTOR_DAILY_MESSAGES_PER_USER ?? 40),
    tutorPerMinutePerUser: Number(process.env.AI_TUTOR_PER_MINUTE_PER_USER ?? 6),
    studioDailyPerUser: Number(process.env.AI_STUDIO_DAILY_GENERATIONS_PER_USER ?? 10),
    tutorEnabled: true,
    studioEnabled: true,
  };
  const [row] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, "ai_limits"));
  return { ...env, ...((row?.value as Partial<AiLimits>) ?? {}) };
}

function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
function dayStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function monthSpendUsd(): Promise<number> {
  const [r] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.usageRecords.costUsd}), 0)` })
    .from(schema.usageRecords)
    .where(gte(schema.usageRecords.createdAt, monthStart()));
  return Number(r.total);
}

export type BudgetState = { spent: number; budget: number; soft: boolean; exhausted: boolean };

export async function budgetState(limits?: AiLimits): Promise<BudgetState> {
  const l = limits ?? (await getLimits());
  const spent = await monthSpendUsd();
  return { spent, budget: l.monthlyBudgetUsd, soft: spent >= l.monthlyBudgetUsd * l.softLimitRatio, exhausted: spent >= l.monthlyBudgetUsd };
}

/** Fixed-window counter in Postgres. Returns the new count; throws when over the limit. */
export async function hitRateLimit(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000);
  const [r] = await db
    .insert(schema.rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({ target: [schema.rateLimits.key, schema.rateLimits.windowStart], set: { count: sql`${schema.rateLimits.count} + 1` } })
    .returning({ count: schema.rateLimits.count });
  if (r.count > limit) throw new LimitError("rate_limited");
  return r.count;
}

export async function countUsageToday(userId: string, feature: "tutor" | "outline" | "lesson") {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.usageRecords)
    .where(and(eq(schema.usageRecords.userId, userId), eq(schema.usageRecords.feature, feature), gte(schema.usageRecords.createdAt, dayStart())));
  return r.n;
}

/**
 * Decide how a tutor request may run. Over the monthly hard cap we degrade to the free extractive
 * provider instead of calling a paid model; per-user limits are hard stops.
 */
export async function guardTutor(userId: string): Promise<{ forceExtractive: boolean; budget: BudgetState }> {
  const limits = await getLimits();
  if (!limits.tutorEnabled) throw new LimitError("feature_disabled");
  await hitRateLimit(`tutor:min:${userId}`, limits.tutorPerMinutePerUser, 60);
  if ((await countUsageToday(userId, "tutor")) >= limits.tutorDailyPerUser) throw new LimitError("daily_limit");
  const budget = await budgetState(limits);
  if (budget.soft && !budget.exhausted) log.warn("ai.budget.soft_limit", { spent: budget.spent, budget: budget.budget });
  return { forceExtractive: budget.exhausted, budget };
}

export async function guardStudio(userId: string): Promise<{ forceExtractive: boolean }> {
  const limits = await getLimits();
  if (!limits.studioEnabled) throw new LimitError("feature_disabled");
  await hitRateLimit(`studio:min:${userId}`, 5, 60);
  if ((await countUsageToday(userId, "outline")) >= limits.studioDailyPerUser) throw new LimitError("daily_limit");
  const budget = await budgetState(limits);
  return { forceExtractive: budget.exhausted };
}

export async function recordUsage(
  u: AiUsage,
  feature: "tutor" | "outline" | "lesson" | "quiz" | "embed" | "revise",
  ctx: { userId?: string | null; organizationId?: string | null; jobId?: string | null },
) {
  await db.insert(schema.usageRecords).values({
    userId: ctx.userId ?? null,
    organizationId: ctx.organizationId ?? null,
    jobId: ctx.jobId ?? null,
    feature,
    provider: u.provider,
    model: u.model,
    tokensIn: u.tokens_in,
    tokensOut: u.tokens_out,
    costUsd: u.cost_usd.toFixed(6),
    latencyMs: u.latency_ms,
  });
}
