import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CompleteLesson, LessonVisit } from "@/components/player/complete-lesson";
import { Flashcards } from "@/components/player/flashcards";
import { OutlineDrawer } from "@/components/player/outline-drawer";
import { QuizPanel } from "@/components/player/quiz";
import { LessonConceptMap } from "@/components/player/lesson-concept-map";
import { TutorPanel } from "@/components/player/tutor-panel";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { requireViewer } from "@/server/authz";
import { renderLessonHtml } from "@/server/markdown";
import { getPlayer } from "@/server/services/learning";
import { conversationHistory } from "@/server/services/tutor";

type Props = { params: Promise<{ courseId: string }>; searchParams: Promise<{ lesson?: string }> };

export async function generateMetadata() {
  return { title: "Learn", robots: { index: false } };
}

export default async function LearnPage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { lesson: lessonParam } = await searchParams;
  const viewer = await requireViewer(`/learn/${courseId}`);
  const [{ t, locale }, player] = await Promise.all([getDict(), getPlayer(viewer, courseId)]);
  if (!player) {
    // Not enrolled (or no access): send to the public course page if there is one.
    if (/^[0-9a-f-]{36}$/.test(courseId)) redirect("/academy");
    notFound();
  }
  const { snapshot, course, progress, attempts } = player;
  const flat = snapshot.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
  if (flat.length === 0) notFound();
  const idx = Math.max(0, flat.findIndex((l) => l.id === (lessonParam ?? player.enrollment.lastLessonId)));
  const lesson = flat[idx];
  const done = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lessonId));
  const percent = Math.round((100 * flat.filter((l) => done.has(l.id)).length) / flat.length);
  const html = renderLessonHtml(lesson.contentMd, lesson.citations.map((c) => c.n));
  const lastAttempt = lesson.quiz ? attempts.find((a) => a.assessmentId === lesson.quiz!.id && a.status === "submitted") : undefined;
  const history = await conversationHistory(viewer, courseId);
  const href = (id: string) => `/learn/${courseId}?lesson=${id}`;

  const outline = (
    <nav aria-label={t.player.outline}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t.player.courseProgress}</p>
      <ProgressBar value={percent} label={t.player.courseProgress} />
      <p className="mt-1 text-xs text-muted">{percent}%</p>
      <ol className="mt-4 space-y-4" lang={course.language}>
        {snapshot.modules.map((m) => (
          <li key={m.id}>
            <p className="text-sm font-semibold text-navy">{m.title}</p>
            <ul className="mt-1 space-y-0.5">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={href(l.id)}
                    aria-current={l.id === lesson.id ? "page" : undefined}
                    className={cn("flex min-h-10 items-start gap-2 rounded-md px-2 py-2 text-sm", l.id === lesson.id ? "bg-teal-50 font-medium text-teal-700" : "hover:bg-bg")}
                  >
                    {done.has(l.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green" aria-label={t.player.completed} /> : <Circle className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />}
                    <span>{l.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <Link href="/dashboard/learner" aria-label={t.nav.dashboard} className="shrink-0"><LogoMark /></Link>
        <OutlineDrawer label={t.player.outline}>{outline}</OutlineDrawer>
        <p className="min-w-0 flex-1 truncate font-semibold" lang={course.language}>{snapshot.title}</p>
      </header>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 lg:block">{outline}</aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <LessonVisit courseId={courseId} lessonId={lesson.id} />
          <article lang={course.language} className="mx-auto max-w-3xl">
            <p className="text-sm text-muted">{lesson.moduleTitle} · {lesson.estimatedMinutes} {t.common.minutes}</p>
            <h1 className="mt-1 text-3xl font-bold text-navy">{lesson.title}</h1>
            {lesson.objectives.length > 0 && (
              <div className="mt-4 rounded-lg border border-line bg-surface p-4">
                <p className="text-sm font-semibold">{t.course.objectives}</p>
                <ul className="mt-1 list-disc pl-5 text-sm">{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              </div>
            )}
            <LessonConceptMap lessonId={lesson.id} title={lesson.title} objectives={lesson.objectives} language={course.language} />
            <div className="prose-lesson mt-6" dangerouslySetInnerHTML={{ __html: html }} />
            {lesson.citations.length > 0 && (
              <section aria-labelledby="refs" className="mt-8 border-t border-line pt-4">
                <h2 id="refs" className="text-sm font-semibold uppercase tracking-wide text-muted">{t.player.references}</h2>
                <ol className="mt-2 space-y-2 text-sm">
                  {lesson.citations.map((c) => (
                    <li key={c.n} id={`ref-${c.n}`} className="rounded-md bg-surface p-3">
                      <span className="font-semibold">[{c.n}] {c.filename}{c.page ? `, p. ${c.page}` : ""}</span>
                      <blockquote className="mt-1 border-l-2 border-teal pl-2 text-muted">“{c.quote}”</blockquote>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {lesson.flashcards.length > 0 && <Flashcards cards={lesson.flashcards} />}
            <CompleteLesson key={lesson.id} courseId={courseId} lessonId={lesson.id} completed={done.has(lesson.id)} />
            {lesson.quiz && (
              <QuizPanel
                courseId={courseId}
                lessonId={lesson.id}
                quiz={{ ...lesson.quiz, questions: lesson.quiz.questions.map(({ correctIndex: _hidden, explanation: _e, ...q }) => q) }}
                lastScore={lastAttempt ? { score: lastAttempt.score ?? 0, passed: !!lastAttempt.passed } : null}
              />
            )}
            <div className="mt-10 flex justify-between gap-3 border-t border-line pt-6">
              {idx > 0 ? (
                <Button asChild variant="outline"><Link href={href(flat[idx - 1].id)}><ArrowLeft aria-hidden /> {t.common.previous}</Link></Button>
              ) : <span />}
              {idx < flat.length - 1 && (
                <Button asChild><Link href={href(flat[idx + 1].id)}>{t.common.next} <ArrowRight aria-hidden /></Link></Button>
              )}
            </div>
          </article>
        </main>
        <TutorPanel courseId={courseId} lessonId={lesson.id} defaultLanguage={locale} history={history ? { conversationId: history.conversationId, messages: history.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, citations: m.citations, grounded: m.grounded })) } : null} />
      </div>
    </div>
  );
}
