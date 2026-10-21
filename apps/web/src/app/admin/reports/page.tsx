import { desc, eq } from "drizzle-orm";
import { ActionButton } from "@/components/admin/actions";
import { PageTitle } from "@/components/dashboard/shell";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { db, schema } from "@/server/db";

export default async function AdminReports() {
  const rows = await db
    .select({ f: schema.feedback, user: schema.users.name, course: schema.courses.title })
    .from(schema.feedback)
    .leftJoin(schema.users, eq(schema.users.id, schema.feedback.userId))
    .leftJoin(schema.courses, eq(schema.courses.id, schema.feedback.courseId))
    .orderBy(desc(schema.feedback.createdAt))
    .limit(200);
  return (
    <>
      <PageTitle title="Reports & feedback" subtitle="Abuse reports, general feedback, and tutor ratings." />
      {rows.length === 0 ? <EmptyState title="Nothing reported" /> : (
        <ul className="space-y-3">
          {rows.map(({ f, user, course }) => (
            <li key={f.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={f.kind === "abuse_report" ? "red" : "neutral"}>{f.kind}</Badge>
                {f.rating !== null && <Badge tone={f.rating > 0 ? "green" : "amber"}>{f.rating > 0 ? "👍 helpful" : "👎 not helpful"}</Badge>}
                <Badge tone={f.status === "open" ? "amber" : "green"}>{f.status}</Badge>
                <span className="text-muted">{user ?? "anonymous"} · {course ?? "—"} · {f.createdAt.toISOString().slice(0, 10)}</span>
              </div>
              {f.comment && <p className="mt-2">{f.comment}</p>}
              {f.status === "open" && <div className="mt-2"><ActionButton url={`/api/admin/feedback/${f.id}`} body={{}} label="Mark resolved" /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
