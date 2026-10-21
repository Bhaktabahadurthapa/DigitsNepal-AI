"use client";

import { createContext, useContext } from "react";
import type { Dict } from "./en";

type Ctx = { locale: "en" | "ne"; t: Dict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
