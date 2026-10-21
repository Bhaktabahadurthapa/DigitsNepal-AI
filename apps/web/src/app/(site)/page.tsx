import { ArrowRight, Bot, GraduationCap, HeartHandshake, MessagesSquare, Wand2 } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import { HeroArt } from "@/components/home/hero-art";
import { StudioDemo } from "@/components/home/studio-demo";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";
import { getViewer } from "@/server/authz";
import { listCatalog } from "@/server/services/learning";

const FEATURED = [
  "introduction-to-artificial-intelligence",
  "prompt-engineering-fundamentals",
  "introduction-to-ai-agents",
  "python-for-ai",
  "responsible-ai-and-digital-safety",
];

export default async function HomePage() {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const catalog = await listCatalog(viewer, { includeComingSoon: true });
  const featured = FEATURED.map((slug) => catalog.find((c) => c.slug === slug)).filter((c) => !!c);
  const modules = [
    { href: "/academy", icon: GraduationCap, ...t.home.modules.academy },
    { href: "/studio", icon: Wand2, ...t.home.modules.studio },
    { href: "/tutor", icon: MessagesSquare, ...t.home.modules.tutor },
    { href: "/agents", icon: Bot, ...t.home.modules.agents },
    { href: "/organizations", icon: HeartHandshake, ...t.home.modules.good },
  ];

  return (
    <>
      <section className="paper-grid border-b border-line bg-bg text-ink">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div>
            <p className="editorial-kicker mb-4 text-lg">
              Simple AI learning for everyday life in Nepal
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl">{t.home.heroTitle}</h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">{t.home.heroSubtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/academy">
                  {t.home.ctaStart} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/organizations">{t.home.ctaExplore}</Link>
              </Button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="modules-title">
        <h2 id="modules-title" className="text-4xl font-semibold text-navy">{t.home.modulesTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">{t.home.modulesSubtitle}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modules.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="group flex h-full flex-col rounded-md border border-line bg-surface p-5 transition-colors hover:border-[#aaa69a] hover:bg-white">
                <m.icon className="size-7 text-teal-700" strokeWidth={1.6} aria-hidden />
                <h3 className="mt-3 font-semibold text-ink group-hover:text-teal-700">{m.title}</h3>
                <p className="mt-1 text-sm text-muted">{m.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="how-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="how-title" className="text-4xl font-semibold text-navy">{t.home.howTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {t.home.how.map((s, i) => (
              <li key={s.title} className="relative border-l border-line bg-bg p-5 first:border-l-0">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#e6ded0] text-sm font-bold text-ink" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="courses-title">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="courses-title" className="text-4xl font-semibold text-navy">{t.home.coursesTitle}</h2>
            <p className="mt-2 text-muted">{t.home.coursesSubtitle}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/academy">{t.home.viewAll}</Link>
          </Button>
        </div>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <li key={c.slug}>
              <CourseCard c={c} t={t} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-surface" aria-labelledby="studio-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="studio-title" className="text-3xl font-bold text-navy">{t.home.studioTitle}</h2>
          <p className="mb-8 mt-2 max-w-3xl text-muted">{t.home.studioSubtitle}</p>
          <StudioDemo />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="impact-title">
        <h2 id="impact-title" className="text-3xl font-bold text-navy">{t.home.impactTitle}</h2>
        <p className="mt-2 max-w-3xl text-muted">{t.home.impactBody}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold">{t.home.impactPilot}</h3>
            <p className="mt-2 text-sm text-muted">{t.home.impactPilotBody}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-semibold">{t.home.impactJoin}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {t.home.impactJoinItems.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="faq-title" className="text-3xl font-bold text-navy">{t.home.faqTitle}</h2>
          <div className="mt-6 divide-y divide-line rounded-xl border border-line">
            {t.home.faq.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span aria-hidden className="text-teal-700 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
