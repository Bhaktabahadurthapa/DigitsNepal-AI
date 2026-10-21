import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal/40 focus-visible:border-teal aria-invalid:border-red-700 disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "h-11 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-700">
      {children}
    </p>
  );
}

export function FieldHint({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-sm text-muted">
      {children}
    </p>
  );
}
