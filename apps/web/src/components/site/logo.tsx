import Link from "next/link";
import { cn } from "@/lib/utils";

/** Transparent DN wordmark rendered in the site's display font. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 32" role="img" aria-label="DN" className={cn("h-8 w-[3.25rem]", className)}>
      <text x="0" y="25" fontFamily="var(--font-sans-display), Figtree, sans-serif" fontSize="27" fontWeight="750" letterSpacing="-3.8"><tspan fill="#191918">D</tspan><tspan fill="#9A452C">N</tspan></text>
    </svg>
  );
}

export function Logo({ name, className, dark }: { name: string; className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-navy", className)}>
      <LogoMark />
      <span className="text-[1.08rem]">{name}</span>
    </Link>
  );
}
