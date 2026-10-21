import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "border-teal/30 bg-teal-50 text-ink", Icon: Info },
  success: { cls: "border-green/30 bg-green-50 text-ink", Icon: CheckCircle2 },
  warning: { cls: "border-amber/30 bg-amber-50 text-ink", Icon: TriangleAlert },
  error: { cls: "border-red/30 bg-red-50 text-ink", Icon: AlertCircle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", cls, className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

const badgeTones = {
  neutral: "bg-slate-100 text-slate-700",
  teal: "bg-teal-50 text-teal-700",
  navy: "bg-navy text-white",
  amber: "bg-amber-50 text-amber",
  green: "bg-green-50 text-green",
  red: "bg-red-50 text-red-700",
} as const;

export function Badge({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}
      {...props}
    />
  );
}

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
    >
      <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {Icon && <Icon className="size-10 text-teal-700" aria-hidden />}
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {action}
    </div>
  );
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
