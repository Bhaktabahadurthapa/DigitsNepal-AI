import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard/shell";
import { AddMember } from "@/components/org/add-member";
import { LibraryUpload } from "@/components/studio/library";
import { CourseStatusBadge } from "@/components/studio/status-badge";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireViewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import { HttpError } from "@/server/errors";
import { isAdmin, isEducator, requireOrgRole } from "@/server/services/access";
import { listDocuments } from "@/server/services/library";

type Props = { params: Promise<{ organizationId: string }> };

export default async function OrgWorkspace({ params }: Props) {
  const { organizationId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(organizationId)) notFound();
  const viewer = await requireViewer(`/organizations/${organizationId}`);
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, organizationId));
  if (!org) notFound();
  let role;
  try {
    role = await requireOrgRole(viewer, organizationId, ["owner", "admin", "reviewer", "member"]);
  } catch (e) {
    if (e instanceof HttpError) notFound(); // never reveal another tenant's workspace
    throw e;
  }
  const manager = role === "owner" || role === "admin" || role === "platform_admin";
  if (org.status !== "active" && !isAdmin(viewer)) {
    return (
      <>
        <PageTitle title={org.name} />
        <Alert tone="info" title={org.status === "pending" ? "Waiting for review" : "Workspace suspended"}>
          {org.status === "pending" ? "A DigitsNepal administrator will review this workspace before it can be used." : "Contact DigitsNepal for help."}
        </Alert>
      </>
    );
  }
  const [members, courses, activity] = await Promise.all([
    db.select({ id: schema.organizationMembers.id, role: schema.organizationMembers.role, name: schema.users.name }).from(schema.organizationMembers).innerJoin(schema.users, eq(schema.users.id, schema.organizationMembers.userId)).where(eq(schema.organizationMembers.organizationId, organizationId)),
    db.select().from(schema.courses).where(eq(schema.courses.organizationId, organizationId)).orderBy(desc(schema.courses.updatedAt)),
    manager ? db.select().from(schema.auditEvents).where(eq(schema.auditEvents.organizationId, organizationId)).orderBy(desc(schema.auditEvents.createdAt)).limit(20) : Promise.resolve([]),
  ]);
  const docs = role === "member" ? [] : await listDocuments(viewer, organizationId);
  const drafts = courses.filter((c) => c.status === "draft" || c.status === "generating");
  const review = courses.filter((c) => c.status === "in_review");
  const published = await db.select({ id: schema.courses.id }).from(schema.courses).where(and(eq(schema.courses.organizationId, organizationId), inArray(schema.courses.status, ["published"])));

  return (
    <>
      <PageTitle title={org.name} subtitle={`${org.kind} workspace · your role: ${role}`} actions={isEducator(viewer) ? <Button asChild><Link href="/studio/new">Create course in Studio</Link></Button> : undefined} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="ov">
          <h2 id="ov" className="font-semibold">Overview</h2>
          <p className="mt-1 text-sm text-muted">{org.description}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-xs text-muted">Members</dt><dd className="text-2xl font-bold">{members.length}</dd></div>
            <div><dt className="text-xs text-muted">Published</dt><dd className="text-2xl font-bold">{published.length}</dd></div>
            <div><dt className="text-xs text-muted">Documents</dt><dd className="text-2xl font-bold">{docs.length}</dd></div>
          </dl>
        </section>
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="team">
          <h2 id="team" className="font-semibold">Team members</h2>
          <ul className="mt-2 divide-y divide-line text-sm">{members.map((m) => <li key={m.id} className="flex justify-between py-2"><span>{m.name}</span><Badge>{m.role}</Badge></li>)}</ul>
          {manager && <AddMember organizationId={organizationId} />}
        </section>
        <section className="rounded-xl border border-line bg-surface p-5 xl:col-span-2" aria-labelledby="kl">
          <h2 id="kl" className="mb-3 font-semibold">Knowledge library</h2>
          {role === "member" ? <p className="text-sm text-muted">Only workspace owners, admins and reviewers can open source documents.</p> : (
            <>
              <LibraryUpload organizationId={organizationId} />
              <ul className="mt-4 divide-y divide-line text-sm">{docs.map((d) => <li key={d.id} className="flex justify-between py-2"><span>{d.filename}</span><Badge tone={d.status === "ready" ? "green" : "amber"}>{d.status}</Badge></li>)}</ul>
            </>
          )}
        </section>
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="dr">
          <h2 id="dr" className="font-semibold">Drafts ({drafts.length})</h2>
          <CourseList courses={drafts} />
        </section>
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="rq">
          <h2 id="rq" className="font-semibold">Review queue ({review.length})</h2>
          <CourseList courses={review} />
        </section>
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="tools">
          <h2 id="tools" className="font-semibold">AI tools</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex justify-between"><span>AI Course Studio</span><Badge tone="green">Available</Badge></li>
            <li className="flex justify-between"><span>AI Tutor for workspace courses</span><Badge tone="green">Available</Badge></li>
            <li className="flex justify-between"><span>Report drafting (records → draft → approval → export)</span><Badge tone="amber">Not started</Badge></li>
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="rep">
          <h2 id="rep" className="font-semibold">Reports</h2>
          <p className="mt-1 text-sm text-muted">The supervised report-drafting workflow is planned (see roadmap). It will never publish or send anything without human approval.</p>
        </section>
        {manager && (
          <section className="rounded-xl border border-line bg-surface p-5 xl:col-span-2" aria-labelledby="act">
            <h2 id="act" className="mb-2 font-semibold">Activity log</h2>
            {activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
              <Table caption="Workspace activity">
                <THead><tr><TH>When (UTC)</TH><TH>Action</TH></tr></THead>
                <TBody>{activity.map((a) => <TR key={a.id}><TD className="text-xs">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</TD><TD><code className="text-xs">{a.action}</code></TD></TR>)}</TBody>
              </Table>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function CourseList({ courses }: { courses: (typeof schema.courses.$inferSelect)[] }) {
  if (courses.length === 0) return <p className="mt-2 text-sm text-muted">None.</p>;
  return (
    <ul className="mt-2 divide-y divide-line text-sm">
      {courses.map((c) => <li key={c.id} className="flex items-center justify-between gap-2 py-2"><Link href={`/studio/${c.id}`} className="hover:underline">{c.title}</Link><CourseStatusBadge status={c.status} /></li>)}
    </ul>
  );
}
