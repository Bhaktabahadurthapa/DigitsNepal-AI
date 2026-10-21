import Link from "next/link";
import { OrgRequestForm } from "@/components/org/request-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { getViewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export const metadata = { title: "For organizations" };

export default async function OrgInfo() {
  const viewer = await getViewer();
  const mine = viewer
    ? await db.select({ id: schema.organizations.id, name: schema.organizations.name, status: schema.organizations.status }).from(schema.organizationMembers).innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMembers.organizationId)).where(eq(schema.organizationMembers.userId, viewer.id))
    : [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">DigitsNepal Transform: for schools and nonprofits</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">Private workspaces where your team builds courses from your own documents and uses supervised AI tools. Data stays inside your workspace, and people approve every consequential output.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Isolated workspace", "Documents and courses are visible only to your members. Enforced on the server, and tested."],
          ["Human review", "AI drafts. Your reviewers approve. Nothing is published or sent automatically."],
          ["Minimal student data", "We collect names and progress only. Learners under 18 need recorded consent before using AI features."],
        ].map(([t, b]) => (
          <div key={t} className="rounded-xl border border-line bg-surface p-5"><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-muted">{b}</p></div>
        ))}
      </div>
      <p className="mt-6 text-sm"><Badge tone="amber">Pilot</Badge> Workspaces are reviewed by an administrator before activation. Report drafting for NGOs is planned, not yet available.</p>
      {mine.length > 0 && (
        <section className="mt-10"><h2 className="text-xl font-semibold">Your workspaces</h2>
          <ul className="mt-3 space-y-2">{mine.map((o) => <li key={o.id}><Link className="font-medium underline" href={`/organizations/${o.id}`}>{o.name}</Link> <Badge>{o.status}</Badge></li>)}</ul>
        </section>
      )}
      <section className="mt-10" aria-labelledby="req">
        <h2 id="req" className="mb-4 text-xl font-semibold">Request a workspace</h2>
        {viewer ? <OrgRequestForm /> : <Button asChild><Link href="/sign-up?next=/organizations">Create an account to apply</Link></Button>}
      </section>
    </div>
  );
}
