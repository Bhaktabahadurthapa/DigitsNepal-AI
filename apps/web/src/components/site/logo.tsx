import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original DigitsNepal mark: a stylised mountain peak formed from a circuit trace. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="#0D2338" />
      <path d="M5 24 L13 10 L17 17 L20 13 L27 24 Z" fill="#0D9488" />
      <path d="M13 10 L15.5 14.3 L13 13 L10.6 14.2 Z" fill="#fff" />
      <circle cx="20" cy="13" r="2" fill="#fff" />
      <circle cx="24.5" cy="8" r="1.6" fill="#DC2626" />
      <path d="M20 13 L24.5 8" stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({ name, className, dark }: { name: string; className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-bold tracking-tight", dark ? "text-white" : "text-navy", className)}>
      <LogoMark />
      <span className="text-lg">{name}</span>
    </Link>
  );
}
