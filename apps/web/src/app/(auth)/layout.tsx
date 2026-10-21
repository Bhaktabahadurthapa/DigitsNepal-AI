import Link from "next/link";
import { LanguageSwitch } from "@/components/site/language-switch";
import { Logo } from "@/components/site/logo";
import { getDict } from "@/lib/i18n";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDict();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo name={t.brand.name} />
        <LanguageSwitch />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </main>
      <footer className="px-4 py-6 text-center text-xs text-muted">
        <Link href="/privacy" className="underline">{t.footer.privacy}</Link> · <Link href="/terms" className="underline">{t.footer.terms}</Link>
      </footer>
    </div>
  );
}
