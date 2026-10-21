import { desc, eq, sql } from "drizzle-orm";
import { ActionButton, ReasonAction } from "@/components/admin/actions";
import { PageTitle } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireAdmin } from "@/server/authz";
import { db, schema } from "@/server/db";

export default async function AdminUsers() {
  const admin = await requireAdmin();
  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      mfa: schema.users.twoFactorEnabled,
      createdAt: schema.users.createdAt,
      educatorStatus: schema.profiles.educatorStatus,
      statement: schema.profiles.educatorStatement,
      isMinor: schema.profiles.isMinor,
      consent: schema.profiles.guardianConsentAt,
      roles: sql<string[]>`coalesce((select array_agg(r.role::text) from roles r where r.user_id = ${schema.users.id}), '{}')`,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .orderBy(desc(schema.users.createdAt))
    .limit(200);
  const pending = users.filter((u) => u.educatorStatus === "pending");
  const minors = users.filter((u) => u.isMinor);
  return (
    <>
      <PageTitle title="Users & roles" />
      <h2 className="mb-2 text-lg font-semibold">Educator approvals ({pending.length})</h2>
      {pending.length === 0 ? <p className="mb-6 text-sm text-muted">No pending requests.</p> : (
        <ul className="mb-6 space-y-3">
          {pending.map((u) => (
            <li key={u.id} className="rounded-xl border border-line bg-surface p-4">
              <p className="font-medium">{u.name} <span className="text-sm text-muted">{u.email}</span></p>
              <p className="mt-1 text-sm">{u.statement}</p>
              <div className="mt-3 flex gap-2">
                <ActionButton url={`/api/admin/educators/${u.id}`} body={{ approve: true }} label="Approve" tone="primary" />
                <ActionButton url={`/api/admin/educators/${u.id}`} body={{ approve: false }} label="Reject" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-2 text-lg font-semibold">Learners under 18 ({minors.length})</h2>
      <p className="mb-3 text-sm text-muted">AI features stay disabled until guardian or educator consent is recorded. Record how consent was obtained.</p>
      {minors.length > 0 && (
        <ul className="mb-6 space-y-2">
          {minors.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3 text-sm">
              <span className="flex-1">{u.name}</span>
              {u.consent ? <Badge tone="green">Consent recorded</Badge> : <Badge tone="amber">No consent</Badge>}
              <ReasonAction url={`/api/admin/users/${u.id}/consent`} label={u.consent ? "Withdraw" : "Record consent"} extra={{ consent: !u.consent }} />
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-2 text-lg font-semibold">All users</h2>
      <Table caption="Users">
        <THead><tr><TH>User</TH><TH>Roles</TH><TH>MFA</TH><TH>Joined</TH><TH>Actions</TH></tr></THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD>{u.name}<span className="block text-xs text-muted">{u.email}</span></TD>
              <TD>{u.roles.map((r) => <Badge key={r} className="mr-1">{r}</Badge>)}</TD>
              <TD>{u.mfa ? <Badge tone="green">on</Badge> : <Badge>off</Badge>}</TD>
              <TD className="text-xs">{u.createdAt.toISOString().slice(0, 10)}</TD>
              <TD className="flex flex-wrap gap-1">
                {u.roles.includes("educator")
                  ? <ActionButton url={`/api/admin/users/${u.id}/roles`} body={{ role: "educator", grant: false }} label="Revoke educator" />
                  : <ActionButton url={`/api/admin/users/${u.id}/roles`} body={{ role: "educator", grant: true }} label="Make educator" />}
                {u.id !== admin.id && (u.roles.includes("admin")
                  ? <ActionButton url={`/api/admin/users/${u.id}/roles`} body={{ role: "admin", grant: false }} label="Revoke admin" confirm="Remove administrator access?" tone="danger" />
                  : <ActionButton url={`/api/admin/users/${u.id}/roles`} body={{ role: "admin", grant: true }} label="Make admin" confirm="Grant full administrator access? They must enable two-factor authentication before using it." />)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
