"use client";

import {
  Activity,
  BookOpen,
  Building2,
  ClipboardCheck,
  Coins,
  FileText,
  Flag,
  Hammer,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessagesSquare,
  PlusCircle,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const Icons = {
  Activity, BookOpen, Building2, ClipboardCheck, Coins, FileText, Flag, Hammer, LayoutDashboard, Library,
  MessagesSquare, PlusCircle, Route, ScrollText, Settings, ShieldCheck, TrendingUp, UserRound, Users,
};

export type NavItem = { href: string; label: string; icon: keyof typeof Icons; soon?: boolean };

export function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="space-y-1">
        {items.map((i) => {
          const Icon = Icons[i.icon];
          const active = path === i.href || (i.href !== "/dashboard/learner" && i.href !== "/dashboard/educator" && path.startsWith(i.href + "/"));
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium", active ? "bg-teal-50 text-teal-700" : "text-ink hover:bg-bg")}
              >
                <Icon className="size-4" aria-hidden />
                <span className="flex-1">{i.label}</span>
                {i.soon && <span className="rounded bg-slate-100 px-1.5 text-[10px] uppercase text-slate-600">soon</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SidebarDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={label}><Menu className="size-6!" /></Button>
      </DialogTrigger>
      <DialogContent title={label} side="left">
        {/* Close the drawer when a link inside it is followed. */}
        <div onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" className="w-full" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}>
      <LogOut aria-hidden /> {label}
    </Button>
  );
}
