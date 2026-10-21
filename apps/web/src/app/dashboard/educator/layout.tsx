import { educatorNav } from "@/components/dashboard/educator-nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { getDict } from "@/lib/i18n";
import { getViewer, hasRole } from "@/server/authz";

export default async function EducatorLayout({ children }: { children: React.ReactNode }) {
  const [viewer, { t }] = await Promise.all([getViewer(), getDict()]);
  // Non-educators still see /studio (an explanation + request-access page); children enforce access.
  if (!viewer || !hasRole(viewer, "educator")) return <>{children}</>;
  return <DashboardShell viewer={viewer} nav={educatorNav(t)} title={t.dash.educatorTitle}>{children}</DashboardShell>;
}
