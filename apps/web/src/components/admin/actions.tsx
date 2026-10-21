"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";

async function post(url: string, body: unknown, method = "POST") {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) toast.error(d.message ?? d.error ?? "Failed");
  return r.ok;
}

export function ActionButton({ url, body, label, confirm, tone = "outline" }: { url: string; body: unknown; label: string; confirm?: string; tone?: "outline" | "primary" | "danger" }) {
  const router = useRouter();
  const run = async () => { if (await post(url, body)) router.refresh(); };
  if (confirm)
    return <ConfirmDialog trigger={<Button size="sm" variant={tone}>{label}</Button>} title={label} description={confirm} confirmLabel={label} tone={tone === "danger" ? "danger" : "primary"} onConfirm={run} />;
  return <Button size="sm" variant={tone} onClick={run}>{label}</Button>;
}

export function ReasonAction({ url, label, extra = {} }: { url: string; label: string; extra?: Record<string, unknown> }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  return (
    <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await post(url, { ...extra, reason, note: reason })) { setReason(""); router.refresh(); } }}>
      <label className="sr-only" htmlFor={`r-${url}`}>Reason</label>
      <Input id={`r-${url}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" className="h-9 w-44 text-sm" minLength={5} required />
      <Button size="sm" variant="outline" type="submit">{label}</Button>
    </form>
  );
}

type Limits = { monthlyBudgetUsd: number; softLimitRatio: number; tutorDailyPerUser: number; tutorPerMinutePerUser: number; studioDailyPerUser: number; tutorEnabled: boolean; studioEnabled: boolean };

export function LimitsForm({ initial }: { initial: Limits }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const num = (k: keyof Limits, label: string, step = "1") => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type="number" step={step} value={String(v[k])} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
    </div>
  );
  return (
    <form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await post("/api/admin/settings", v, "PUT")) { toast.success("Saved"); router.refresh(); } }}>
      {num("monthlyBudgetUsd", "Monthly AI budget hard cap (USD)", "0.01")}
      {num("softLimitRatio", "Soft-limit warning ratio (0–1)", "0.05")}
      {num("tutorDailyPerUser", "Tutor messages per user per day")}
      {num("tutorPerMinutePerUser", "Tutor messages per user per minute")}
      {num("studioDailyPerUser", "Studio generations per educator per day")}
      <div className="space-y-2 sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-teal-700" checked={v.tutorEnabled} onChange={(e) => setV({ ...v, tutorEnabled: e.target.checked })} /> AI Tutor enabled</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-teal-700" checked={v.studioEnabled} onChange={(e) => setV({ ...v, studioEnabled: e.target.checked })} /> AI Course Studio generation enabled</label>
      </div>
      <Button type="submit" className="sm:col-span-2 sm:w-fit">Save configuration</Button>
    </form>
  );
}
