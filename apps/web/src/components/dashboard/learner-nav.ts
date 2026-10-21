import type { Dict } from "@/lib/i18n";
import type { NavItem } from "./nav";

export const learnerNav = (t: Dict): NavItem[] => [
  { href: "/dashboard/learner", label: t.dash.overview, icon: "LayoutDashboard" },
  { href: "/dashboard/learner/courses", label: t.dash.myCourses, icon: "BookOpen" },
  { href: "/dashboard/learner/paths", label: t.dash.paths, icon: "Route", soon: true },
  { href: "/tutor", label: t.dash.tutor, icon: "MessagesSquare" },
  { href: "/dashboard/learner/quizzes", label: t.dash.quizzes, icon: "ClipboardCheck" },
  { href: "/dashboard/learner/projects", label: t.dash.projects, icon: "Hammer", soon: true },
  { href: "/dashboard/learner/progress", label: t.dash.progress, icon: "TrendingUp" },
  { href: "/settings", label: t.dash.profile, icon: "UserRound" },
  { href: "/settings/security", label: t.dash.settings, icon: "Settings" },
];
