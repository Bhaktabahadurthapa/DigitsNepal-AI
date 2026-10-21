import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ReasonAction } from "@/components/admin/actions";
import { PageTitle } from "@/components/dashboard/shell";
import { CourseStatusBadge } from "@/components/studio/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db, schema } from "@/server/db";

export default async function AdminCourses() {
  const rows = await db
    .select({
      id: schema.courses.id,
      slug: schema.courses.slug,
      title: schema.courses.title,
      status: schema.courses.status,
      owner: schema.users.name,
      org: schema.organizations.name,
      reports: sql<number>`(select count(*)::int from feedback f where f.course_id = ${schema.courses.id} and f.kind = 'abuse_report' and f.status = 'open')`,
    })
    .from(schema.courses)
    .innerJoin(schema.users, eq(schema.users.id, schema.courses.ownerId))
    .leftJoin(schema.organizations, eq(schema.organizations.id, schema.courses.organizationId))
    .orderBy(desc(schema.courses.updatedAt))
    .limit(300);
  return (
    <>
      <PageTitle title="Course moderation" subtitle="Archive courses that violate policy. Archiving removes them from the catalog; the reason is audited." />
      <Table caption="Courses">
        <THead><tr><TH>Course</TH><TH>Owner</TH><TH>Status</TH><TH>Open reports</TH><TH>Actions</TH></tr></THead>
        <TBody>
          {rows.map((c) => (
            <TR key={c.id}>
              <TD className="font-medium">{c.status === "published" ? <Link className="underline" href={`/academy/${c.slug}`}>{c.title}</Link> : c.title}{c.org && <span className="block text-xs text-muted">{c.org}</span>}</TD>
              <TD>{c.owner}</TD>
              <TD><CourseStatusBadge status={c.status} /></TD>
              <TD>{c.reports}</TD>
              <TD>{c.status !== "archived" && <ReasonAction url={`/api/admin/courses/${c.id}/archive`} label="Archive" />}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  );
}
