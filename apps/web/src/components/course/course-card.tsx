import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/feedback";
import type { Dict } from "@/lib/i18n";

export type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  language: "en" | "ne";
  level: "beginner" | "intermediate" | "advanced";
  availability: "available" | "coming_soon";
  lessonCount: number;
  minutes: number;
};

export function CourseCard({ c, t }: { c: CourseCardData; t: Dict }) {
  const soon = c.availability === "coming_soon";
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="teal">{t.course.level[c.level]}</Badge>
        <Badge tone="neutral" lang={c.language}>{c.language === "ne" ? "नेपाली" : "English"}</Badge>
        {soon && <Badge tone="amber">{t.common.comingSoon}</Badge>}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-ink" lang={c.language}>
        {c.title}
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted" lang={c.language}>
        {c.summary}
      </p>
      {!soon && (
        <p className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><BookOpen className="size-4" aria-hidden /> {c.lessonCount} {t.common.lessons}</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-4" aria-hidden /> {c.minutes} {t.common.minutes}</span>
        </p>
      )}
    </>
  );
  const cls = "flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-sm";
  return soon ? (
    <div className={`${cls} opacity-80`} aria-disabled>{body}</div>
  ) : (
    <Link href={`/academy/${c.slug}`} className={`${cls} transition-shadow hover:shadow-md focus-visible:shadow-md`}>
      {body}
    </Link>
  );
}
