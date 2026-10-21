import { learnerNav } from "@/components/dashboard/learner-nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [viewer, { t }] = await Promise.all([requireViewer("/settings"), getDict()]);
  return <DashboardShell viewer={viewer} nav={learnerNav(t)} title={t.dash.settings}>{children}</DashboardShell>;
}
