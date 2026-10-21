import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";
import { getViewer } from "@/server/authz";
import { LanguageSwitch } from "./language-switch";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export async function SiteHeader() {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const links = [
    { href: "/academy", label: t.nav.academy },
    { href: "/studio", label: t.nav.studio },
    { href: "/agents", label: t.nav.agents },
    { href: "/organizations", label: t.nav.organizations },
    { href: "/community", label: t.nav.community },
    { href: "/about", label: t.nav.about },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-navy focus:px-3 focus:py-2 focus:text-white">
        {t.nav.skip}
      </a>
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo name={t.brand.name} />
        <nav aria-label={t.nav.main} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-bg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitch />
          {viewer ? (
            <Button asChild size="md">
              <Link href="/dashboard/learner">{t.nav.dashboard}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">{t.nav.signIn}</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">{t.nav.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
        <MobileMenu links={links} signedIn={!!viewer} />
      </div>
    </header>
  );
}
