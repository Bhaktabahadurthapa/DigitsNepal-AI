"use client";

import { CheckCircle2, FileText, ListTree, PenLine, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const icons = [FileText, Sparkles, ListTree, PenLine, Rocket];

/** A static, clearly-labelled walkthrough. It performs no AI request. */
export function StudioDemo() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const steps = t.home.studioSteps;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <ol className="space-y-2" aria-label={t.home.studioTitle}>
        {steps.map((s, i) => {
          const Icon = icons[i];
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={step === i ? "step" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                  step === i ? "border-teal bg-teal-50" : "border-line bg-surface hover:bg-bg",
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", step === i ? "bg-teal-700 text-white" : "bg-slate-100 text-navy")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">
                    {i + 1}. {s.title}
                  </span>
                  <span className="block text-sm text-muted">{s.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm" aria-live="polite">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-navy">AI Course Studio</span>
          <Badge tone="amber">{t.home.studioDemoLabel}</Badge>
        </div>
        <DemoPanel step={step} />
      </div>
    </div>
  );
}

function DemoPanel({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="rounded-xl border-2 border-dashed border-line p-8 text-center">
        <FileText className="mx-auto size-10 text-teal-700" aria-hidden />
        <p className="mt-2 font-medium">digital-safety-handbook.pdf</p>
        <p className="text-sm text-muted">PDF · 1.2 MB · 14 pages</p>
        <div className="mx-auto mt-4 h-2 w-48 rounded-full bg-slate-200"><div className="h-2 w-full rounded-full bg-teal" /></div>
      </div>
    );
  if (step === 1 || step === 2)
    return (
      <div className="space-y-3">
        {["Module 1 · Staying safe online", "Module 2 · Recognising scams", "Module 3 · Protecting your data"].map((m, i) => (
          <div key={m} className="rounded-lg border border-line p-3">
            <p className="font-semibold">{m}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted">
              <li>Lesson {i * 2 + 1}</li>
              <li>Lesson {i * 2 + 2}</li>
            </ul>
          </div>
        ))}
        {step === 2 && (
          <p className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green">
            <CheckCircle2 className="size-4" aria-hidden /> Outline approved by educator
          </p>
        )}
      </div>
    );
  if (step === 3)
    return (
      <article className="space-y-2 text-sm">
        <h3 className="text-base font-semibold">Recognising scams</h3>
        <p>Scam messages often create urgency and ask for passwords or payment. <sup className="font-semibold text-teal-700">[1]</sup></p>
        <p className="rounded bg-slate-50 p-2 text-xs text-muted">[1] digital-safety-handbook.pdf, p. 4</p>
        <div className="rounded-lg border border-line p-3">
          <p className="font-medium">Quiz · 3 questions</p>
        </div>
      </article>
    );
  return (
    <div className="space-y-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-green">
        <Rocket className="size-4" aria-hidden /> Version 1 published
      </p>
      <p className="text-muted">Learners now see version 1. Later edits stay in draft until you publish version 2.</p>
    </div>
  );
}
