import { desc, eq, gte, sql } from "drizzle-orm";
import { PageTitle, StatCard } from "@/components/dashboard/shell";
import { Alert, ProgressBar } from "@/components/ui/feedback";
import { db, schema } from "@/server/db";
import { ai } from "@/server/services/ai-client";
import { budgetState } from "@/server/services/ai-guard";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

export default async function AdminOverview() {
  const since = hoursAgo(24);
  const [[users], [pendingEdu], [queue], [failed24], budget, health, [reports]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.users),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.profiles).where(eq(schema.profiles.educatorStatus, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.generationJobs).where(eq(schema.generationJobs.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.generationJobs).where(sql`${schema.generationJobs.status} = 'failed' and ${schema.generationJobs.finishedAt} >= ${since}`),
    budgetState(),
    ai.health(),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.feedback).where(sql`${schema.feedback.kind} = 'abuse_report' and ${schema.feedback.status} = 'open'`),
  ]);
  const recent = await db.select().from(schema.auditEvents).where(gte(schema.auditEvents.createdAt, since)).orderBy(desc(schema.auditEvents.createdAt)).limit(8);
  const pct = budget.budget ? (100 * budget.spent) / budget.budget : 0;
  return (
    <>
      <PageTitle title="Administration" subtitle="Live platform health and governance." />
      {budget.exhausted && <Alert tone="error" className="mb-4" title="Monthly AI budget exhausted">AI features now run in free extractive mode until the budget is raised or the month resets.</Alert>}
      {budget.soft && !budget.exhausted && <Alert tone="warning" className="mb-4" title="AI spend above soft limit" />}
      {!health && <Alert tone="error" className="mb-4" title="AI service unreachable" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.n} />
        <StatCard label="Pending educator requests" value={pendingEdu.n} />
        <StatCard label="Queued AI jobs" value={queue.n} hint={`${failed24.n} failed in last 24h`} />
        <StatCard label="Open abuse reports" value={reports.n} />
      </div>
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <p className="font-semibold">AI spend this month</p>
        <ProgressBar className="mt-3" value={pct} label="AI budget used" />
        <p className="mt-1 text-sm text-muted">${budget.spent.toFixed(4)} of ${budget.budget.toFixed(2)} · provider: {health?.provider ?? "unknown"}</p>
      </div>
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <p className="mb-2 font-semibold">Recent activity (24h)</p>
        <ul className="space-y-1 text-sm">{recent.map((e) => <li key={e.id}><code className="text-xs">{e.action}</code> <span className="text-muted">{e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span></li>)}</ul>
      </div>
    </>
  );
}
