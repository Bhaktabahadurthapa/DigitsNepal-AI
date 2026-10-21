import { and, desc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/dashboard/shell";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDict } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { requireViewer } from "@/server/authz";
import { db, schema } from "@/server/db";

export default async function Quizzes() {
  const viewer = await requireViewer();
  const { t, locale } = await getDict();
  const rows = await db
    .select({ a: schema.quizAttempts, title: schema.courses.title, snapshot: schema.courseVersions.snapshot })
    .from(schema.quizAttempts)
    .innerJoin(schema.enrollments, eq(schema.enrollments.id, schema.quizAttempts.enrollmentId))
    .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
    .innerJoin(schema.courseVersions, eq(schema.courseVersions.id, schema.quizAttempts.courseVersionId))
    .where(and(eq(schema.quizAttempts.userId, viewer.id), eq(schema.quizAttempts.status, "submitted")))
    .orderBy(desc(schema.quizAttempts.submittedAt))
    .limit(100);
  return (
    <>
      <PageTitle title={t.dash.quizzes} />
      {rows.length === 0 ? <EmptyState title="—" /> : (
        <Table caption={t.dash.quizzes}>
          <THead><tr><TH>{t.player.quiz}</TH><TH>{t.dash.myCourses}</TH><TH>{t.player.score}</TH><TH>Date</TH></tr></THead>
          <TBody>
            {rows.map(({ a, title, snapshot }) => (
              <TR key={a.id}>
                <TD>{snapshot.modules.flatMap((m) => m.lessons).find((l) => l.id === a.lessonId)?.title ?? "—"}</TD>
                <TD>{title}</TD>
                <TD><Badge tone={a.passed ? "green" : "amber"}>{a.score}%</Badge></TD>
                <TD>{formatDate(a.submittedAt, locale)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
