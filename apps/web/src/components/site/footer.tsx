import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { Logo } from "./logo";

export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || "/community#open-source";

export async function SiteFooter() {
  const { t } = await getDict();
  const cols = [
    { title: t.nav.academy, links: [{ href: "/academy", label: t.nav.academy }, { href: "/studio", label: t.nav.studio }, { href: "/agents", label: t.nav.agents }] },
    { title: t.footer.community, links: [{ href: "/community", label: t.footer.community }, { href: GITHUB_URL, label: t.footer.github }, { href: "/organizations", label: t.nav.organizations }] },
    { title: t.footer.about, links: [{ href: "/about", label: t.footer.about }, { href: "/contact", label: t.footer.contact }, { href: "/accessibility", label: t.footer.accessibility }, { href: "/privacy", label: t.footer.privacy }, { href: "/terms", label: t.footer.terms }] },
  ];
  return (
    <footer className="bg-navy text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-3">
          <Logo name={t.brand.name} dark />
          <p className="text-sm text-slate-300">{t.footer.mission}</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="mb-3 text-sm font-semibold text-white">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-slate-300 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} DigitsNepal. {t.footer.rights}</p>
          <p>{t.footer.status}</p>
        </div>
      </div>
    </footer>
  );
}
