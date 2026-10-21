import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "course"
  );
}

export function formatDate(d: Date | string | null | undefined, locale = "en") {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale === "ne" ? "ne-NP" : "en-GB", { dateStyle: "medium" }).format(new Date(d));
}
