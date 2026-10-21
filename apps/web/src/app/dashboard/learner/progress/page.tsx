import { PageTitle, StatCard } from "@/components/dashboard/shell";
import { ProgressBar } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";
import { learnerDashboard } from "@/server/services/learning";

export default async function ProgressPage() {
  const viewer = await requireViewer();
  const [{ t }, data] = await Promise.all([getDict(), learnerDashboard(viewer)]);
  const total = data.courses.reduce((n, c) => n + c.total, 0);
  const avg = data.recentQuizzes.length ? Math.round(data.recentQuizzes.reduce((n, q) => n + q.score, 0) / data.recentQuizzes.length) : null;
  return (
    <>
      <PageTitle title={t.dash.progress} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.dash.completedLessons} value={`${data.completedLessons} / ${total}`} />
        <StatCard label={t.player.completed} value={data.courses.filter((c) => c.status === "completed").length} />
        <StatCard label={t.dash.recentQuiz} value={avg === null ? "—" : `${avg}%`} hint="Average of last 5 quizzes" />
      </div>
      <ul className="space-y-4">
        {data.courses.map((c) => (
          <li key={c.courseId} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-medium" lang={c.language}>{c.title}</p>
            <ProgressBar className="mt-2" value={c.percent} label={`${c.title} ${t.dash.progress}`} />
            <p className="mt-1 text-sm text-muted">{c.percent}%</p>
          </li>
        ))}
      </ul>
    </>
  );
}
