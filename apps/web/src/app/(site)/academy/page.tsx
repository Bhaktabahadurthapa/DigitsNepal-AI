import { CourseCard } from "@/components/course/course-card";
import { getDict } from "@/lib/i18n";
import { getViewer } from "@/server/authz";
import { listCatalog } from "@/server/services/learning";

export async function generateMetadata() {
  const { t } = await getDict();
  return { title: t.nav.academy };
}

export default async function AcademyPage() {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  const courses = await listCatalog(viewer, { language: "en", includeComingSoon: true });
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="editorial-kicker text-lg">Learn with intention</p>
      <h1 className="mt-2 max-w-4xl text-5xl font-semibold leading-[1.05] text-navy sm:text-7xl">{t.home.modules.academy.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{t.home.modules.academy.body}</p>
      <p className="mt-6 inline-flex rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium">Simple English</p>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <CourseCard c={c} t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}
