import { learnerNav } from "@/components/dashboard/learner-nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const [viewer, { t }] = await Promise.all([requireViewer("/dashboard/learner"), getDict()]);
  return <DashboardShell viewer={viewer} nav={learnerNav(t)} title={t.nav.dashboard}>{children}</DashboardShell>;
}
