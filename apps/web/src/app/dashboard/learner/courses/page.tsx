import Link from "next/link";
import { PageTitle } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, ProgressBar } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";
import { learnerDashboard } from "@/server/services/learning";

export default async function MyCourses() {
  const viewer = await requireViewer();
  const [{ t }, data] = await Promise.all([getDict(), learnerDashboard(viewer)]);
  return (
    <>
      <PageTitle title={t.dash.myCourses} actions={<Button asChild variant="outline"><Link href="/academy">{t.dash.browse}</Link></Button>} />
      {data.courses.length === 0 ? (
        <EmptyState title={t.dash.noCourses} action={<Button asChild><Link href="/academy">{t.dash.browse}</Link></Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.courses.map((c) => (
            <li key={c.courseId} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold" lang={c.language}>{c.title}</h2>
                {c.status === "completed" && <Badge tone="green">{t.player.completed}</Badge>}
              </div>
              <ProgressBar className="mt-3" value={c.percent} label={`${c.title} ${t.dash.progress}`} />
              <p className="mt-1 text-sm text-muted">{c.completed}/{c.total} {t.common.lessons}</p>
              <Button asChild size="sm" className="mt-4"><Link href={`/learn/${c.courseId}`}>{t.course.resume}</Link></Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
