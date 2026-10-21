import Link from "next/link";
import { LanguageSwitch } from "@/components/site/language-switch";
import { Logo } from "@/components/site/logo";
import { getDict } from "@/lib/i18n";
import type { Viewer } from "@/server/authz";
import { NavLinks, type NavItem, SidebarDrawer, SignOutButton } from "./nav";

export async function DashboardShell({ viewer, nav, title, children }: { viewer: Viewer; nav: NavItem[]; title: string; children: React.ReactNode }) {
  const { t } = await getDict();
  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <NavLinks items={nav} label={title} />
      <div className="mt-auto space-y-2 border-t border-line pt-4 text-sm">
        <p className="truncate font-medium">{viewer.name}</p>
        <p className="truncate text-xs text-muted">{viewer.email}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {viewer.roles.includes("educator") || viewer.roles.includes("admin") ? (
            <Link className="text-xs text-teal-700 underline" href="/dashboard/educator">{t.dash.educatorTitle}</Link>
          ) : null}
          {viewer.roles.includes("admin") && <Link className="text-xs text-teal-700 underline" href="/admin">Admin</Link>}
        </div>
        <SignOutButton label={t.nav.signOut} />
      </div>
    </div>
  );
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4">
        <SidebarDrawer label={title}>{sidebar}</SidebarDrawer>
        <Logo name={t.brand.name} />
        <span className="hidden text-sm text-muted sm:inline">/ {title}</span>
        <div className="ml-auto"><LanguageSwitch /></div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 lg:block">{sidebar}</aside>
        <main id="main" className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
