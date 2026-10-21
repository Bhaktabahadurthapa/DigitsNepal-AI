import { CourseCard } from "@/components/course/course-card";
import { getDict } from "@/lib/i18n";
import { getViewer } from "@/server/authz";
import { listCatalog } from "@/server/services/learning";

export async function generateMetadata() {
  const { t } = await getDict();
  return { title: t.nav.academy };
}

export default async function AcademyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [{ t, locale }, viewer, sp] = await Promise.all([getDict(), getViewer(), searchParams]);
  const lang = sp.lang === "en" || sp.lang === "ne" ? sp.lang : undefined;
  const courses = await listCatalog(viewer, { language: lang, includeComingSoon: !lang });
  const filters = [
    { href: "/academy", label: locale === "ne" ? "सबै" : "All", active: !lang },
    { href: "/academy?lang=en", label: "English", active: lang === "en" },
    { href: "/academy?lang=ne", label: "नेपाली", active: lang === "ne" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.home.modules.academy.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.home.modules.academy.body}</p>
      <nav aria-label={t.course.language} className="mt-6 flex gap-2">
        {filters.map((f) => (
          <a key={f.href} href={f.href} aria-current={f.active ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium ${f.active ? "border-navy bg-navy text-white" : "border-line bg-surface hover:bg-bg"}`}>
            {f.label}
          </a>
        ))}
      </nav>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <CourseCard c={c} t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}
