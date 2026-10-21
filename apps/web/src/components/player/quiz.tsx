"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Q = { id: string; prompt: string; options: string[] };
type Result = { score: number; passed: boolean; passScore: number; results: { questionId: string; correct: boolean; correctIndex: number; explanation: string }[] };

export function QuizPanel({ courseId, lessonId, quiz, lastScore }: { courseId: string; lessonId: string; quiz: { id: string; title: string; questions: Q[] }; lastScore: { score: number; passed: boolean } | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const r = await fetch(`/api/learn/${courseId}/lessons/${lessonId}/quiz`, { method: "POST" });
    setBusy(false);
    if (!r.ok) return toast.error(t.common.error);
    setAttemptId((await r.json()).attemptId);
    setAnswers({});
    setResult(null);
    window.dispatchEvent(new CustomEvent("dn:quiz", { detail: { active: true } }));
  }

  async function submit() {
    if (!attemptId) return;
    setBusy(true);
    const r = await fetch(`/api/quiz-attempts/${attemptId}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) });
    setBusy(false);
    if (!r.ok) return toast.error(t.common.error);
    setResult(await r.json());
    setAttemptId(null);
    window.dispatchEvent(new CustomEvent("dn:quiz", { detail: { active: false } }));
    router.refresh();
  }

  const byId = new Map(result?.results.map((r) => [r.questionId, r]));
  return (
    <section aria-labelledby="quiz-title" className="mt-8 rounded-xl border border-line bg-surface p-5">
      <h2 id="quiz-title" className="text-lg font-semibold">{t.player.quiz}</h2>
      {lastScore && !attemptId && !result && (
        <p className="mt-1 text-sm text-muted">{t.player.score}: {lastScore.score}% {lastScore.passed ? `· ${t.player.passed}` : ""}</p>
      )}
      {!attemptId && !result && (
        <Button className="mt-4" onClick={start} disabled={busy}>{lastScore ? t.player.retake : t.player.startQuiz}</Button>
      )}
      {(attemptId || result) && (
        <form
          className="mt-4 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {quiz.questions.map((q, qi) => {
            const r = byId.get(q.id);
            return (
              <fieldset key={q.id} className="space-y-2">
                <legend className="font-medium">{qi + 1}. {q.prompt}</legend>
                {q.options.map((o, oi) => {
                  const selected = answers[q.id] === oi;
                  const isCorrect = r && r.correctIndex === oi;
                  return (
                    <label key={oi} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2", selected ? "border-teal bg-teal-50" : "border-line", r && isCorrect && "border-green bg-green-50", r && selected && !r.correct && "border-red bg-red-50")}>
                      <input type="radio" name={q.id} className="size-4 accent-teal-700" checked={selected} disabled={!!result} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                      <span>{o}</span>
                      {r && isCorrect && <CheckCircle2 className="ml-auto size-4 text-green" aria-label="correct answer" />}
                      {r && selected && !r.correct && <XCircle className="ml-auto size-4 text-red-700" aria-label="your answer, incorrect" />}
                    </label>
                  );
                })}
                {r?.explanation && <p className="text-sm text-muted">{r.explanation}</p>}
              </fieldset>
            );
          })}
          {result ? (
            <div className="space-y-3">
              <Alert tone={result.passed ? "success" : "warning"} title={`${t.player.score}: ${result.score}%`}>
                {result.passed ? t.player.passed : t.player.notPassed}
              </Alert>
              <Button type="button" variant="outline" onClick={start}>{t.player.retake}</Button>
            </div>
          ) : (
            <Button type="submit" disabled={busy || Object.keys(answers).length < quiz.questions.length}>{t.player.submitQuiz}</Button>
          )}
        </form>
      )}
    </section>
  );
}
