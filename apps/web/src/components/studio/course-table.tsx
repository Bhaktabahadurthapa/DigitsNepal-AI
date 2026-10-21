import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { listEducatorCourses } from "@/server/services/courses";
import { CourseStatusBadge } from "./status-badge";

export function CourseTable({ courses, locale }: { courses: Awaited<ReturnType<typeof listEducatorCourses>>; locale: string }) {
  if (courses.length === 0)
    return <EmptyState title="No courses yet" action={<Button asChild><Link href="/studio/new">Create course</Link></Button>}>Create your first course from your own approved materials.</EmptyState>;
  return (
    <Table caption="Your courses">
      <THead>
        <tr><TH>Title</TH><TH>Status</TH><TH>Type</TH><TH>Learners</TH><TH>Updated</TH><TH><span className="sr-only">Actions</span></TH></tr>
      </THead>
      <TBody>
        {courses.map((c) => (
          <TR key={c.id}>
            <TD className="font-medium" lang={c.language}>{c.title}</TD>
            <TD><CourseStatusBadge status={c.status} /></TD>
            <TD className="capitalize">{c.learningType}</TD>
            <TD>{c.enrollments}</TD>
            <TD>{formatDate(c.updatedAt, locale)}</TD>
            <TD className="whitespace-nowrap text-right">
              <Button asChild size="sm" variant="outline"><Link href={`/studio/${c.id}`}>Edit</Link></Button>{" "}
              {c.status === "published" && <Button asChild size="sm" variant="ghost"><Link href={`/academy/${c.slug}`}>View</Link></Button>}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
