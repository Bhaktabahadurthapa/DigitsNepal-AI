import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { PageTitle, StatCard } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Badge, EmptyState, ProgressBar } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { requireViewer } from "@/server/authz";
import { learnerDashboard, listCatalog } from "@/server/services/learning";

export const metadata = { title: "Learner dashboard" };

export default async function LearnerOverview({ searchParams }: { searchParams: Promise<{ educator?: string }> }) {
  const viewer = await requireViewer();
  const [{ t, locale }, data, catalog, sp] = await Promise.all([getDict(), learnerDashboard(viewer), listCatalog(viewer), searchParams]);
  const enrolledIds = new Set(data.courses.map((c) => c.courseId));
  const recommended = catalog.filter((c) => !enrolledIds.has(c.id) && c.availability === "available").slice(0, 3);
  const upcoming = data.courses.filter((c) => c.nextLesson).slice(0, 4);
  return (
    <>
      <PageTitle title={`${t.dash.welcome}, ${viewer.name.split(" ")[0]}`} />
      {sp.educator === "required" && (
        <Alert tone="info" className="mb-6" title={t.dash.becomeEducator}>
          <Link href="/settings#educator" className="underline">{t.dash.becomeEducator}</Link>
        </Alert>
      )}
      {data.continueCourse ? (
        <Card className="mb-6 border-teal/40">
          <CardHeader>
            <p className="text-sm font-semibold text-teal-700">{t.dash.continue}</p>
            <CardTitle as="h2" lang={data.continueCourse.language}>{data.continueCourse.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={data.continueCourse.percent} label={`${data.continueCourse.title} ${t.dash.progress}`} />
            <p className="text-sm text-muted" lang={data.continueCourse.language}>{data.continueCourse.nextLesson?.title} · {data.continueCourse.percent}%</p>
            <Button asChild>
              <Link href={`/learn/${data.continueCourse.courseId}?lesson=${data.continueCourse.nextLesson?.id}`}>{t.course.resume} <ArrowRight aria-hidden /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6">
          <EmptyState icon={BookOpen} title={t.dash.noCourses} action={<Button asChild><Link href="/academy">{t.dash.browse}</Link></Button>} />
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.dash.enrolled} value={data.courses.length} />
        <StatCard label={t.dash.completedLessons} value={data.completedLessons} />
        <StatCard label={t.dash.recentQuiz} value={data.recentQuizzes[0] ? `${data.recentQuizzes[0].score}%` : "—"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle as="h2">{t.dash.enrolled}</CardTitle></CardHeader>
          <CardContent>
            {data.courses.length === 0 ? <p className="text-sm text-muted">{t.dash.noCourses}</p> : (
              <ul className="space-y-4">
                {data.courses.map((c) => (
                  <li key={c.courseId}>
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/learn/${c.courseId}`} className="font-medium hover:underline" lang={c.language}>{c.title}</Link>
                      {c.status === "completed" ? <Badge tone="green">{t.player.completed}</Badge> : <span className="text-sm text-muted">{c.completed}/{c.total}</span>}
                    </div>
                    <ProgressBar className="mt-2" value={c.percent} label={`${c.title} ${t.dash.progress}`} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">{t.dash.recentQuiz}</CardTitle></CardHeader>
          <CardContent>
            {data.recentQuizzes.length === 0 ? <p className="text-sm text-muted">—</p> : (
              <ul className="divide-y divide-line">
                {data.recentQuizzes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{q.lessonTitle}<span className="block text-xs text-muted">{formatDate(q.submittedAt, locale)}</span></span>
                    <Badge tone={q.passed ? "green" : "amber"}>{q.score}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">{t.dash.upcoming}</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? <p className="text-sm text-muted">—</p> : (
              <ul className="space-y-2 text-sm">
                {upcoming.map((c) => (
                  <li key={c.courseId}><Link className="hover:underline" href={`/learn/${c.courseId}?lesson=${c.nextLesson!.id}`} lang={c.language}>{c.nextLesson!.title}</Link> <span className="text-muted">· {c.title} · {c.nextLesson!.minutes} {t.common.minutes}</span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle as="h2">{t.dash.recommended}</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recommended.map((c) => (
                <li key={c.id}><Link className="font-medium hover:underline" href={`/academy/${c.slug}`} lang={c.language}>{c.title}</Link> <span className="text-muted">· {c.lessonCount} {t.common.lessons}</span></li>
              ))}
              {recommended.length === 0 && <li className="text-muted">—</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
