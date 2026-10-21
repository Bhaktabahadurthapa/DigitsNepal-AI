import { type Dict, en } from "./en";
import { ne } from "./ne";

export type Locale = "en" | "ne";
export const LOCALE_COOKIE = "dn_lang";
export const dictionaries: Record<Locale, Dict> = { en, ne };

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "ne";
}

export async function getLocale(): Promise<Locale> {
  return "en";
}

export async function getDict(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

export type { Dict };
