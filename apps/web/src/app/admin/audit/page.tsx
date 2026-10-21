import { desc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard/shell";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db, schema } from "@/server/db";

export default async function AdminAudit() {
  const rows = await db
    .select({ e: schema.auditEvents, actor: schema.users.name })
    .from(schema.auditEvents)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditEvents.actorId))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(300);
  return (
    <>
      <PageTitle title="Audit log" subtitle="Last 300 security- and governance-relevant events." />
      <Table caption="Audit events">
        <THead><tr><TH>When (UTC)</TH><TH>Actor</TH><TH>Action</TH><TH>Target</TH><TH>Details</TH></tr></THead>
        <TBody>
          {rows.map(({ e, actor }) => (
            <TR key={e.id}>
              <TD className="whitespace-nowrap text-xs">{e.createdAt.toISOString().slice(0, 19).replace("T", " ")}</TD>
              <TD>{actor ?? "—"}</TD>
              <TD><code className="text-xs">{e.action}</code></TD>
              <TD className="text-xs">{e.targetType}:{e.targetId?.slice(0, 8)}</TD>
              <TD className="max-w-xs truncate text-xs">{JSON.stringify(e.metadata)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
