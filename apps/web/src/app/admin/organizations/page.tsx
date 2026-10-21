import { desc, sql } from "drizzle-orm";
import { ActionButton } from "@/components/admin/actions";
import { PageTitle } from "@/components/dashboard/shell";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db, schema } from "@/server/db";

export default async function AdminOrgs() {
  const orgs = await db
    .select({ o: schema.organizations, members: sql<number>`(select count(*)::int from organization_members m where m.organization_id = ${schema.organizations.id})` })
    .from(schema.organizations)
    .orderBy(desc(schema.organizations.createdAt));
  return (
    <>
      <PageTitle title="Organizations" subtitle="Review school and nonprofit workspaces before they are activated." />
      {orgs.length === 0 ? <EmptyState title="No organizations yet" /> : (
        <Table caption="Organizations">
          <THead><tr><TH>Name</TH><TH>Type</TH><TH>Members</TH><TH>Status</TH><TH>Actions</TH></tr></THead>
          <TBody>
            {orgs.map(({ o, members }) => (
              <TR key={o.id}>
                <TD className="font-medium">{o.name}<span className="block text-xs text-muted">{o.description}</span></TD>
                <TD className="capitalize">{o.kind}</TD>
                <TD>{members}</TD>
                <TD><Badge tone={o.status === "active" ? "green" : o.status === "pending" ? "amber" : "red"}>{o.status}</Badge></TD>
                <TD className="flex gap-1">
                  {o.status !== "active" && <ActionButton url={`/api/admin/organizations/${o.id}`} body={{ status: "active" }} label="Activate" tone="primary" />}
                  {o.status !== "suspended" && <ActionButton url={`/api/admin/organizations/${o.id}`} body={{ status: "suspended" }} label="Suspend" confirm="Members lose access to this workspace until it is reactivated." tone="danger" />}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
