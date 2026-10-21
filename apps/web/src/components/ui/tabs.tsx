"use client";

import { Tabs as T } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export function TabsList({ className, ...p }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex gap-1 rounded-lg bg-slate-100 p-1", className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "min-h-9 rounded-md px-3 text-sm font-medium text-slate-600 data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm cursor-pointer",
        className,
      )}
      {...p}
    />
  );
}
export const TabsContent = T.Content;
