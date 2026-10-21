"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ className, dark }: { className?: string; dark?: boolean }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "en" ? "ne" : "en";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setLocale(next); router.refresh(); })}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium cursor-pointer",
        dark ? "border-white/30 text-white hover:bg-white/10" : "border-line bg-surface text-ink hover:bg-bg",
        className,
      )}
      aria-label={`${t.nav.language}: ${locale === "en" ? "English" : "नेपाली"}. ${next === "ne" ? "नेपालीमा हेर्नुहोस्" : "Switch to English"}`}
    >
      <Languages aria-hidden className="size-4" />
      <span lang={next}>{next === "ne" ? "नेपाली" : "English"}</span>
    </button>
  );
}
