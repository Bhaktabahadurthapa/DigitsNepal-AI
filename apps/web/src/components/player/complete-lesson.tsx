"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Records that the learner opened a lesson (resume point). */
export function LessonVisit({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  useEffect(() => {
    void fetch(`/api/learn/${courseId}/lessons/${lessonId}/visit`, { method: "POST" });
  }, [courseId, lessonId]);
  return null;
}

/** "Mark complete" becomes available once the end of the lesson has been scrolled into view. */
export function CompleteLesson({ courseId, lessonId, completed }: { courseId: string; lessonId: string; completed: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setReachedEnd(true), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (completed)
    return (
      <p className="mt-8 flex items-center gap-2 font-semibold text-green" role="status">
        <CheckCircle2 className="size-5" aria-hidden /> {t.player.completed}
      </p>
    );
  return (
    <div ref={ref} className="mt-8 rounded-xl border border-line bg-surface p-4">
      <Button
        disabled={!reachedEnd || busy}
        aria-describedby="complete-hint"
        onClick={async () => {
          setBusy(true);
          const r = await fetch(`/api/learn/${courseId}/lessons/${lessonId}/complete`, { method: "POST" });
          setBusy(false);
          if (!r.ok) return toast.error(t.common.error);
          toast.success(t.player.completed);
          router.refresh();
        }}
      >
        <CheckCircle2 aria-hidden /> {t.player.markComplete}
      </Button>
      {!reachedEnd && <p id="complete-hint" className="mt-2 text-sm text-muted">{t.player.reachEnd}</p>}
    </div>
  );
}
