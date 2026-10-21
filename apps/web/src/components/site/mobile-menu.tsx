"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { LanguageSwitch } from "./language-switch";

export function MobileMenu({ links, signedIn }: { links: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-6!" /> : <Menu className="size-6!" />}
      </Button>
      {open && (
        <div ref={panelRef} id="mobile-menu" onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)} className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface px-4 pb-6 pt-2 shadow-lg">
          <nav aria-label={t.nav.main}>
            <ul className="divide-y divide-line">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex min-h-12 items-center text-base font-medium text-ink" aria-current={pathname === l.href ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LanguageSwitch className="self-start" />
            {signedIn ? (
              <Button asChild variant="primary" size="lg">
                <Link href="/dashboard/learner">{t.nav.dashboard}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in">{t.nav.signIn}</Link>
                </Button>
                <Button asChild variant="primary" size="lg">
                  <Link href="/sign-up">{t.nav.getStarted}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
