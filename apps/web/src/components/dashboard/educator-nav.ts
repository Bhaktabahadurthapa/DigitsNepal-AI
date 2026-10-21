import type { Dict } from "@/lib/i18n";
import type { NavItem } from "./nav";

export const educatorNav = (t: Dict): NavItem[] => [
  { href: "/dashboard/educator", label: t.dash.overview, icon: "LayoutDashboard" },
  { href: "/studio", label: t.dash.myCourses, icon: "BookOpen" },
  { href: "/studio/new", label: t.dash.createCourse, icon: "PlusCircle" },
  { href: "/dashboard/educator/library", label: t.dash.library, icon: "Library" },
  { href: "/dashboard/educator/assessments", label: t.dash.assessments, icon: "ClipboardCheck" },
  { href: "/dashboard/educator/learners", label: t.dash.learners, icon: "Users" },
  { href: "/dashboard/educator/analytics", label: t.dash.analytics, icon: "TrendingUp" },
  { href: "/settings", label: t.dash.settings, icon: "Settings" },
];
