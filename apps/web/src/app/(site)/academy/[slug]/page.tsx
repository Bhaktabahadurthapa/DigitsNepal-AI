import { CheckCircle2, Clock, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollButton } from "@/components/course/enroll-button";
import { CourseRoadmap } from "@/components/course/course-roadmap";
import { ReportButton } from "@/components/course/report-button";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { getViewer } from "@/server/authz";
import { getPublicCourse } from "@/server/services/learning";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const data = await getPublicCourse(await getViewer(), (await params).slug);
  return { title: data?.course.title ?? "Course", description: data?.course.summary };
}

export default async function CoursePage({ params }: Props) {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const data = await getPublicCourse(viewer, (await params).slug);
  if (!data) notFound();
  const { course, snapshot, enrollment } = data;
  const lessons = snapshot?.modules.flatMap((m) => m.lessons) ?? [];
  const minutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/academy" className="underline">{t.nav.academy}</Link> / <span lang={course.language}>{course.title}</span>
      </nav>
      <div className="flex flex-wrap gap-2">
        <Badge tone="teal">{t.course.level[course.level]}</Badge>
        <Badge lang={course.language}>{course.language === "ne" ? "नेपाली" : "English"}</Badge>
        {course.availability === "coming_soon" && <Badge tone="amber">{t.common.comingSoon}</Badge>}
      </div>
      <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] text-navy sm:text-6xl" lang={course.language}>{course.title}</h1>
      <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted" lang={course.language}>{course.summary}</p>
      {course.notice && (
        <Alert tone="info" className="mt-6" title={t.common.status}>
          <span lang={course.language}>{course.notice}</span>
        </Alert>
      )}

      {snapshot ? (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {enrollment ? (
              <Button asChild size="lg">
                <Link href={`/learn/${course.id}`}>{t.course.resume}</Link>
              </Button>
            ) : viewer ? (
              <EnrollButton courseId={course.id} label={t.course.enroll} />
            ) : (
              <Button asChild size="lg">
                <Link href={`/sign-in?next=${encodeURIComponent(`/academy/${course.slug}`)}`}>{t.course.signInToEnroll}</Link>
              </Button>
            )}
            {viewer && <ReportButton courseId={course.id} />}
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <Clock className="size-4" aria-hidden /> {lessons.length} {t.common.lessons} · {minutes} {t.common.minutes}
            </span>
          </div>

          {snapshot.objectives.length > 0 && (
            <section className="mt-10" aria-labelledby="obj">
              <h2 id="obj" className="text-xl font-semibold">{t.course.objectives}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2" lang={course.language}>
                {snapshot.objectives.map((o) => (
                  <li key={o} className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-teal-700" aria-hidden />{o}</li>
                ))}
              </ul>
            </section>
          )}

          <CourseRoadmap title={snapshot.title} modules={snapshot.modules} />

          <section className="mt-10" aria-labelledby="curr">
            <h2 id="curr" className="text-xl font-semibold">{t.course.curriculum}</h2>
            <ol className="mt-3 space-y-3" lang={course.language}>
              {snapshot.modules.map((m, i) => (
                <li key={m.id} className="rounded-md border border-line bg-surface p-6 transition-colors hover:border-[#aaa69a]">
                  <h3 className="font-semibold">{i + 1}. {m.title}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex justify-between gap-4">
                        <span>{l.title}</span>
                        <span className="shrink-0">{l.estimatedMinutes} {t.common.minutes}{l.quiz ? " · Quiz" : ""}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : (
        <Alert tone="warning" className="mt-6" title={t.common.comingSoon}>
          <Info className="hidden" aria-hidden />
        </Alert>
      )}
    </div>
  );
}
