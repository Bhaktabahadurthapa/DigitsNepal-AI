"use client";

import { BookOpen, ClipboardCheck, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import { createCourseSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "course", label: "Full course", body: "Modules, lessons and quizzes.", icon: BookOpen },
  { value: "assessment", label: "Assessment", body: "Short review notes plus a larger question set.", icon: ClipboardCheck },
  { value: "lesson", label: "Short lesson", body: "One focused lesson with a quiz.", icon: FileText },
] as const;

export function CreateCourseWizard({ organizations }: { organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("course");
  const [form, setForm] = useState({ title: "", audience: "", language: "en", level: "beginner", objectives: "", organizationId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createCourseSchema.safeParse({
      learningType: type,
      title: form.title,
      audience: form.audience,
      language: form.language,
      level: form.level,
      objectives: form.objectives.split("\n").map((s) => s.trim()).filter(Boolean),
      organizationId: form.organizationId || null,
      visibility: form.organizationId ? "organization" : "public",
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const r = await fetch("/api/studio/courses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    if (!r.ok) {
      setBusy(false);
      return setError("Could not create the course. Please try again.");
    }
    router.push(`/studio/${(await r.json()).id}`);
  }

  if (step === 1)
    return (
      <fieldset className="max-w-3xl">
        <legend className="mb-3 font-semibold">Step 1 · What do you want to create?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((tp) => (
            <label key={tp.value} className={cn("flex cursor-pointer flex-col gap-2 rounded-xl border-2 bg-surface p-4", type === tp.value ? "border-teal" : "border-line")}>
              <input type="radio" name="type" value={tp.value} checked={type === tp.value} onChange={() => setType(tp.value)} className="sr-only" />
              <tp.icon className="size-6 text-teal-700" aria-hidden />
              <span className="font-semibold">{tp.label}</span>
              <span className="text-sm text-muted">{tp.body}</span>
            </label>
          ))}
        </div>
        <Button className="mt-6" onClick={() => setStep(2)}>Continue</Button>
      </fieldset>
    );

  return (
    <form onSubmit={submit} noValidate className="max-w-2xl space-y-5">
      <p className="font-semibold">Step 2 · Describe your {TYPES.find((x) => x.value === type)!.label.toLowerCase()}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-invalid={!!errors.title} aria-describedby="title-err" />
        <FieldError id="title-err">{errors.title}</FieldError>
      </div>
      <div>
        <Label htmlFor="audience">Audience</Label>
        <Input id="audience" placeholder="e.g. Grade 9 students in community schools" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="language">Course language</Label>
          <Select id="language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="en">English</option>
            <option value="ne">नेपाली (Nepali)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="level">Difficulty</Label>
          <Select id="level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="objectives">Learning objectives (one per line)</Label>
        <Textarea id="objectives" rows={4} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} aria-describedby="obj-hint" />
        <FieldHint id="obj-hint">Optional, up to 8. These guide the AI outline.</FieldHint>
      </div>
      {organizations.length > 0 && (
        <div>
          <Label htmlFor="org">Workspace</Label>
          <Select id="org" value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
            <option value="">Personal (public Academy when published)</option>
            {organizations.map((o) => <option key={o.id} value={o.id}>{o.name} (members only)</option>)}
          </Select>
        </div>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create and add sources"}</Button>
      </div>
    </form>
  );
}
