import { FileText, ListChecks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/shell";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { CourseTable } from "@/components/studio/course-table";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";
import { getViewer, hasRole } from "@/server/authz";
import { listEducatorCourses } from "@/server/services/courses";

export const metadata = { title: "AI Course Studio" };

export default async function StudioHome() {
  const [viewer, { t, locale }] = await Promise.all([getViewer(), getDict()]);
  if (viewer && hasRole(viewer, "educator")) {
    const courses = await listEducatorCourses(viewer);
    return (
      <>
        <PageTitle title={t.nav.studio} subtitle="Create courses from approved documents. AI drafts; you review, edit and publish." actions={<Button asChild><Link href="/studio/new">{t.dash.createCourse}</Link></Button>} />
        <CourseTable courses={courses} locale={locale} />
      </>
    );
  }
  const features = [
    { icon: FileText, title: "Start from your materials", body: "Upload PDF, DOCX, Markdown or text files you have the right to use. Text is extracted and indexed privately." },
    { icon: ListChecks, title: "Approve the outline first", body: "AI proposes modules and lessons. Nothing is generated until you edit and approve the plan." },
    { icon: ShieldCheck, title: "You stay in control", body: "Every lesson cites its source passages. AI suggestions are proposals you accept or reject. Only you publish." },
  ];
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold text-navy">{t.nav.studio}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{t.home.modules.studio.body}</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-xl border border-line bg-surface p-5">
              <f.icon className="size-7 text-teal-700" aria-hidden />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {viewer ? (
            <Button asChild size="lg"><Link href="/settings#educator">{t.dash.becomeEducator}</Link></Button>
          ) : (
            <Button asChild size="lg"><Link href="/sign-up?next=/settings%23educator">{t.nav.getStarted}</Link></Button>
          )}
          <Button asChild size="lg" variant="outline"><Link href="/#studio-title">See the walkthrough</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
