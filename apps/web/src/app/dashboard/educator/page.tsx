import Link from "next/link";
import { PageTitle, StatCard } from "@/components/dashboard/shell";
import { CourseTable } from "@/components/studio/course-table";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";
import { requireRole } from "@/server/authz";
import { listEducatorCourses } from "@/server/services/courses";

export const metadata = { title: "Educator dashboard" };

export default async function EducatorOverview() {
  const viewer = await requireRole("educator", "/dashboard/educator");
  const [{ t, locale }, courses] = await Promise.all([getDict(), listEducatorCourses(viewer)]);
  const count = (s: string) => courses.filter((c) => c.status === s).length;
  return (
    <>
      <PageTitle title={t.dash.educatorTitle} actions={<Button asChild><Link href="/studio/new">{t.dash.createCourse}</Link></Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Drafts" value={count("draft") + count("generating")} />
        <StatCard label="In review" value={count("in_review")} />
        <StatCard label="Published" value={count("published")} />
        <StatCard label={t.dash.learners} value={courses.reduce((n, c) => n + c.enrollments, 0)} />
      </div>
      <h2 className="mb-3 text-lg font-semibold">{t.dash.myCourses}</h2>
      <CourseTable courses={courses} locale={locale} />
    </>
  );
}
