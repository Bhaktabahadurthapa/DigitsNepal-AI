import { eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireRole } from "@/server/authz";
import { db, schema } from "@/server/db";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  const viewer = await requireRole("educator", "/dashboard/educator/assessments");
  const mine = viewer.roles.includes("admin")
    ? await db.select({ id: schema.courses.id }).from(schema.courses)
    : await db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.ownerId, viewer.id));
  const rows = mine.length
    ? await db
        .select({
          id: schema.assessments.id,
          title: schema.assessments.title,
          courseId: schema.courses.id,
          course: schema.courses.title,
          passScore: schema.assessments.passScore,
          questions: sql<number>`(select count(*)::int from questions q where q.assessment_id = ${schema.assessments.id})`,
        })
        .from(schema.assessments)
        .innerJoin(schema.courses, eq(schema.courses.id, schema.assessments.courseId))
        .where(inArray(schema.assessments.courseId, mine.map((m) => m.id)))
    : [];
  return (
    <>
      <PageTitle title="Assessments" subtitle="Lesson quizzes across your courses. Edit questions in the Studio." />
      {rows.length === 0 ? <EmptyState title="No assessments yet" /> : (
        <Table caption="Assessments">
          <THead><tr><TH>Quiz</TH><TH>Course</TH><TH>Questions</TH><TH>Pass score</TH><TH><span className="sr-only">Actions</span></TH></tr></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="font-medium">{r.title}</TD>
                <TD>{r.course}</TD>
                <TD>{r.questions}</TD>
                <TD>{r.passScore}%</TD>
                <TD className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/studio/${r.courseId}`}>Edit</Link></Button></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
