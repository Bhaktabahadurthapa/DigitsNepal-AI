import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ai } from "@/server/services/ai-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  let database = "ok";
  let queueDepth: number | null = null;
  try {
    const r = await db.execute<{ n: number }>(sql`select count(*)::int as n from generation_jobs where status = 'pending'`);
    queueDepth = r.rows[0]?.n ?? 0;
  } catch {
    database = "error";
  }
  const aiHealth = await ai.health();
  const ok = database === "ok";
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", database, queueDepth, ai: aiHealth ? { status: "ok", provider: aiHealth.provider } : { status: "unreachable" }, latencyMs: Date.now() - t0 },
    { status: ok ? 200 : 503 },
  );
}
