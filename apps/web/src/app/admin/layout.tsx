import type { NavItem } from "@/components/dashboard/nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/server/authz";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users & roles", icon: "Users" },
  { href: "/admin/courses", label: "Course moderation", icon: "BookOpen" },
  { href: "/admin/organizations", label: "Organizations", icon: "Building2" },
  { href: "/admin/ai", label: "AI usage & errors", icon: "Coins" },
  { href: "/admin/audit", label: "Audit log", icon: "ScrollText" },
  { href: "/admin/reports", label: "Reports", icon: "Flag" },
  { href: "/admin/settings", label: "Configuration", icon: "Settings" },
];

export const metadata = { title: "Administration", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireAdmin();
  return <DashboardShell viewer={viewer} nav={nav} title="Administration">{children}</DashboardShell>;
}
