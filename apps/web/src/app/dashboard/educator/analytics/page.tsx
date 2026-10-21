import { PageTitle } from "@/components/dashboard/shell";
import { EmptyState, ProgressBar } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireRole } from "@/server/authz";
import { educatorCourseStats } from "@/server/services/educator-stats";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const viewer = await requireRole("educator", "/dashboard/educator/analytics");
  const { courses } = await educatorCourseStats(viewer);
  return (
    <>
      <PageTitle title="Analytics" subtitle="Live figures from enrollments and submitted quiz attempts in your courses." />
      {courses.length === 0 ? <EmptyState title="No published courses yet" /> : (
        <Table caption="Course analytics">
          <THead><tr><TH>Course</TH><TH>Enrolled</TH><TH>Completion</TH><TH>Quiz attempts</TH><TH>Avg. score</TH><TH>Pass rate</TH></tr></THead>
          <TBody>
            {courses.map((c) => {
              const rate = c.total ? Math.round((100 * c.completed) / c.total) : 0;
              return (
                <TR key={c.id}>
                  <TD className="font-medium" lang={c.language}>{c.title}</TD>
                  <TD>{c.total}</TD>
                  <TD className="min-w-40"><ProgressBar value={rate} label={`${c.title} completion`} /><span className="text-xs text-muted">{c.completed}/{c.total} ({rate}%)</span></TD>
                  <TD>{c.attempts}</TD>
                  <TD>{c.attempts ? `${c.avg}%` : "—"}</TD>
                  <TD>{c.attempts ? `${c.passRate}%` : "—"}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
