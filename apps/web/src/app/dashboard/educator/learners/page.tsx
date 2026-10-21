import { PageTitle } from "@/components/dashboard/shell";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDict } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/server/authz";
import { educatorCourseStats } from "@/server/services/educator-stats";

export const metadata = { title: "Learners" };

export default async function LearnersPage() {
  const viewer = await requireRole("educator", "/dashboard/educator/learners");
  const [{ locale }, { courses, learners }] = await Promise.all([getDict(), educatorCourseStats(viewer)]);
  const title = new Map(courses.map((c) => [c.id, c.title]));
  return (
    <>
      <PageTitle title="Learners" subtitle="Learners enrolled in your courses. Only names and progress are shown; contact details are not shared with educators." />
      {learners.length === 0 ? <EmptyState title="No learners yet" /> : (
        <Table caption="Learners">
          <THead><tr><TH>Learner</TH><TH>Course</TH><TH>Lessons completed</TH><TH>Status</TH><TH>Enrolled</TH></tr></THead>
          <TBody>
            {learners.map((l, i) => (
              <TR key={i}>
                <TD>{l.name}</TD>
                <TD>{title.get(l.courseId)}</TD>
                <TD>{l.completedLessons}</TD>
                <TD><Badge tone={l.status === "completed" ? "green" : "neutral"}>{l.status}</Badge></TD>
                <TD>{formatDate(l.enrolledAt, locale)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
