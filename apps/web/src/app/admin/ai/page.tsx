import { desc, eq, gte, sql } from "drizzle-orm";
import { PageTitle, StatCard } from "@/components/dashboard/shell";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db, schema } from "@/server/db";

export default async function AdminAi() {
  const month = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const byFeature = await db
    .select({
      feature: schema.usageRecords.feature,
      provider: schema.usageRecords.provider,
      model: schema.usageRecords.model,
      calls: sql<number>`count(*)::int`,
      tokensIn: sql<number>`sum(${schema.usageRecords.tokensIn})::int`,
      tokensOut: sql<number>`sum(${schema.usageRecords.tokensOut})::int`,
      cost: sql<string>`sum(${schema.usageRecords.costUsd})`,
      p50: sql<number>`percentile_cont(0.5) within group (order by ${schema.usageRecords.latencyMs})::int`,
      p95: sql<number>`percentile_cont(0.95) within group (order by ${schema.usageRecords.latencyMs})::int`,
    })
    .from(schema.usageRecords)
    .where(gte(schema.usageRecords.createdAt, month))
    .groupBy(schema.usageRecords.feature, schema.usageRecords.provider, schema.usageRecords.model);
  const [jobs] = await db
    .select({ total: sql<number>`count(*)::int`, failed: sql<number>`count(*) filter (where ${schema.generationJobs.status} = 'failed')::int` })
    .from(schema.generationJobs)
    .where(gte(schema.generationJobs.createdAt, month));
  const failures = await db.select().from(schema.generationJobs).where(eq(schema.generationJobs.status, "failed")).orderBy(desc(schema.generationJobs.finishedAt)).limit(20);
  const total = byFeature.reduce((n, r) => n + Number(r.cost), 0);
  return (
    <>
      <PageTitle title="AI usage, cost & errors" subtitle="This month (UTC). Costs are computed from configured per-token prices; verify them against provider invoices." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Estimated cost (USD)" value={`$${total.toFixed(4)}`} />
        <StatCard label="AI calls" value={byFeature.reduce((n, r) => n + r.calls, 0)} />
        <StatCard label="Job failure rate" value={jobs.total ? `${Math.round((100 * jobs.failed) / jobs.total)}%` : "—"} hint={`${jobs.failed} of ${jobs.total} jobs`} />
      </div>
      <Table caption="Usage by feature">
        <THead><tr><TH>Feature</TH><TH>Provider / model</TH><TH>Calls</TH><TH>Tokens in/out</TH><TH>Latency p50/p95</TH><TH>Cost</TH></tr></THead>
        <TBody>
          {byFeature.map((r) => (
            <TR key={`${r.feature}-${r.model}`}>
              <TD>{r.feature}</TD><TD>{r.provider} / {r.model}</TD><TD>{r.calls}</TD><TD>{r.tokensIn} / {r.tokensOut}</TD><TD>{r.p50} / {r.p95} ms</TD><TD>${Number(r.cost).toFixed(4)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <h2 className="mb-2 mt-8 text-lg font-semibold">Recent failed jobs</h2>
      <Table caption="Failed jobs">
        <THead><tr><TH>Type</TH><TH>Attempts</TH><TH>Error</TH><TH>When</TH></tr></THead>
        <TBody>
          {failures.map((j) => <TR key={j.id}><TD>{j.type}</TD><TD>{j.attempts}</TD><TD className="max-w-md truncate text-xs">{j.error}</TD><TD className="text-xs">{j.finishedAt?.toISOString().slice(0, 16)}</TD></TR>)}
        </TBody>
      </Table>
    </>
  );
}
