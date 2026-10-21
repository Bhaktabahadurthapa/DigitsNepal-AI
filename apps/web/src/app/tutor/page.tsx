import Link from "next/link";
import { learnerNav } from "@/components/dashboard/learner-nav";
import { DashboardShell, PageTitle } from "@/components/dashboard/shell";
import { TutorPanel } from "@/components/player/tutor-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";
import { learnerDashboard } from "@/server/services/learning";
import { conversationHistory } from "@/server/services/tutor";

export const metadata = { title: "AI Tutor" };

export default async function TutorPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const viewer = await requireViewer("/tutor");
  const [{ t, locale }, data, sp] = await Promise.all([getDict(), learnerDashboard(viewer), searchParams]);
  const selected = data.courses.find((c) => c.courseId === sp.course) ?? data.courses[0];
  const history = selected ? await conversationHistory(viewer, selected.courseId) : null;
  return (
    <DashboardShell viewer={viewer} nav={learnerNav(t)} title={t.tutor.title}>
      <PageTitle title={t.tutor.title} subtitle={t.tutor.intro} />
      {!selected ? (
        <EmptyState title={t.tutor.pickCourse} action={<Button asChild><Link href="/academy">{t.dash.browse}</Link></Button>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label={t.dash.myCourses}>
            <ul className="space-y-1">
              {data.courses.map((c) => (
                <li key={c.courseId}>
                  <Link href={`/tutor?course=${c.courseId}`} aria-current={c.courseId === selected.courseId ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm ${c.courseId === selected.courseId ? "bg-teal-50 font-medium text-teal-700" : "hover:bg-surface"}`} lang={c.language}>
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex h-[70dvh] flex-col overflow-hidden rounded-xl border border-line bg-surface">
            <TutorPanel
              key={selected.courseId}
              standalone
              courseId={selected.courseId}
              defaultLanguage={locale}
              history={history ? { conversationId: history.conversationId, messages: history.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, citations: m.citations, grounded: m.grounded })) } : null}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
