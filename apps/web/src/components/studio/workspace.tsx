"use client";

import { AlertTriangle, Check, CheckCircle2, FileText, Loader2, Plus, RefreshCw, Sparkles, Trash2, Upload, Wand2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Alert, Badge, ProgressBar } from "@/components/ui/feedback";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CourseStatusBadge } from "./status-badge";

type Citation = { n: number; chunkId: string; documentId: string; filename: string; quote: string; page?: number | null };
type Question = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string };
type Lesson = {
  id: string;
  title: string;
  objectives: string[];
  contentMd: string;
  citations: Citation[];
  estimatedMinutes: number;
  status: "pending" | "ready" | "failed";
  origin: string;
  proposedRevision: { instruction: string } | null;
  questions: Question[];
};
type Outline = { modules: { title: string; summary?: string; lessons: { title: string; objectives: string[]; sourceChunkIds?: string[] }[] }[]; notes?: string };
type Job = { id: string; type: string; status: string; progress: number; message: string | null; error: string | null };
type Source = { id: string; filename: string; status: string; error: string | null; sizeBytes: number; pageCount: number | null; injectionFlags: number };

type Props = {
  course: {
    id: string;
    slug: string;
    title: string;
    language: "en" | "ne";
    status: "draft" | "generating" | "in_review" | "published" | "archived";
    learningType: string;
    outline: Outline | null;
    outlineStatus: "none" | "proposed" | "approved";
    publishedVersionId: string | null;
    publishedAt: string | null;
    updatedAt: string;
  };
  modules: { id: string; title: string; lessons: Lesson[] }[];
  previews: Record<string, string>;
  sources: Source[];
  library: { id: string; filename: string; status: string }[];
  job: Job | null;
  versions: { version: number; publishedAt: string; changelog: string | null }[];
};

async function api(path: string, method: string, body?: unknown) {
  const r = await fetch(path, {
    method,
    headers: body instanceof FormData || body === undefined ? undefined : { "content-type": "application/json" },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function errorText(data: { message?: string; error?: string }) {
  return data.message ?? data.error?.replaceAll("_", " ") ?? "Something went wrong.";
}

const STEPS = ["Type", "Details", "Sources", "Analyze", "Outline", "Generate", "Review", "Publish"];

export function StudioWorkspace(props: Props) {
  const { course, sources, job } = props;
  const router = useRouter();
  const hasLessons = props.modules.some((m) => m.lessons.length > 0);
  const sourcesReady = sources.length > 0 && sources.every((s) => s.status === "ready");
  const jobActive = job && (job.status === "pending" || job.status === "running");
  const processing = sources.some((s) => s.status === "uploaded" || s.status === "processing");

  const step = course.status === "published" ? 8 : hasLessons && course.outlineStatus === "approved" && course.status !== "generating" ? 7
    : course.outlineStatus === "approved" ? 6 : course.outlineStatus === "proposed" ? 5 : sourcesReady ? 4 : 3;

  // Poll while background work is running, then refresh the server-rendered data.
  useEffect(() => {
    if (!jobActive && !processing && course.status !== "generating") return;
    let last = JSON.stringify({ job, s: sources.map((s) => s.status), st: course.status });
    const t = setInterval(async () => {
      const r = await api(`/api/studio/courses/${course.id}/status`, "GET");
      if (!r.ok) return;
      const cur = JSON.stringify({ job: r.data.job, s: r.data.sources.map((s: Source) => s.status), st: r.data.status });
      if (cur !== last) {
        last = cur;
        router.refresh();
      }
    }, 2000);
    return () => clearInterval(t);
  }, [jobActive, processing, course.status, course.id, job, sources, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">AI Course Studio · <span className="capitalize">{course.learningType}</span></p>
          <h1 className="text-2xl font-bold text-navy" lang={course.language}>{course.title}</h1>
        </div>
        <div className="flex items-center gap-2"><CourseStatusBadge status={course.status} />{props.versions[0] && <Badge>v{props.versions[0].version}</Badge>}</div>
      </div>
      <ol className="flex flex-wrap gap-2" aria-label="Course creation steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i + 1 === step ? "step" : undefined} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", i + 1 < step ? "bg-green-50 text-green" : i + 1 === step ? "bg-navy text-white" : "bg-slate-100 text-muted")}>
            {i + 1 < step ? <Check className="size-3" aria-hidden /> : <span aria-hidden>{i + 1}</span>} {s}
          </li>
        ))}
      </ol>

      {job?.status === "failed" && (
        <Alert tone="error" title="The last AI job failed">
          <p>{job.error ?? "Unknown error"}</p>
          <p className="mt-1">Your sources and edits are safe. You can retry; the job resumes where it stopped.</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={async () => {
            const r = await api(`/api/studio/courses/${course.id}/retry`, "POST");
            if (!r.ok) toast.error(errorText(r.data));
            router.refresh();
          }}><RefreshCw aria-hidden /> Retry</Button>
        </Alert>
      )}
      {jobActive && <JobProgress job={job} />}

      {step <= 4 && <SourcesStep {...props} />}
      {step === 4 && !jobActive && (
        <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="analyze">
          <h2 id="analyze" className="font-semibold">Step 4 · Analyze sources and propose an outline</h2>
          <p className="mt-1 text-sm text-muted">AI reads a sample of your indexed passages and proposes modules and lessons. Nothing else is generated yet.</p>
          <Button className="mt-4" onClick={async () => {
            const r = await api(`/api/studio/courses/${course.id}/outline`, "POST");
            if (!r.ok) return toast.error(errorText(r.data));
            router.refresh();
          }}><Sparkles aria-hidden /> Propose outline</Button>
        </section>
      )}
      {step === 5 && course.outline && <OutlineEditor courseId={course.id} outline={course.outline} />}
      {step >= 7 && <Editor {...props} />}
    </div>
  );
}

function JobProgress({ job }: { job: Job }) {
  const router = useRouter();
  const label = job.type === "generate_outline" ? "Proposing outline" : job.type === "generate_course" ? "Generating lessons and quizzes" : "Processing source";
  return (
    <section className="rounded-xl border border-teal/40 bg-teal-50 p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold"><Loader2 className="size-4 animate-spin" aria-hidden /> {label}</p>
        <Button size="sm" variant="outline" onClick={async () => { await api(`/api/studio/jobs/${job.id}/cancel`, "POST"); router.refresh(); }}>Cancel</Button>
      </div>
      <ProgressBar className="mt-3" value={job.progress} label={label} />
      <p className="mt-2 text-sm text-muted">{job.message ?? (job.status === "pending" ? "Waiting for a worker…" : "Working…")}</p>
      <p className="mt-1 text-xs text-muted">You can leave this page; work continues in the background.</p>
    </section>
  );
}

function SourcesStep({ course, sources, library }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const attachedIds = new Set(sources.map((s) => s.id));
  const available = library.filter((d) => !attachedIds.has(d.id) && d.status !== "failed");
  const [pick, setPick] = useState("");

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("rightsConfirmed", String(rights));
    const up = await api("/api/studio/documents", "POST", fd);
    if (!up.ok) {
      setBusy(false);
      return toast.error(errorText(up.data));
    }
    const at = await api(`/api/studio/courses/${course.id}/sources`, "POST", { documentId: up.data.documentId });
    setBusy(false);
    if (!at.ok) return toast.error(errorText(at.data));
    toast.success("Uploaded. Extracting text…");
    setFile(null);
    setRights(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="sources">
      <h2 id="sources" className="font-semibold">Step 3 · Add approved source materials</h2>
      <p className="mt-1 text-sm text-muted">PDF, DOCX, Markdown or TXT, up to 10 MB each. Scanned image-only PDFs are not supported yet.</p>
      <form onSubmit={upload} className="mt-4 space-y-3">
        <Label htmlFor="file">Choose a file</Label>
        <input id="file" type="file" accept=".pdf,.docx,.md,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy file:px-4 file:font-semibold file:text-white" />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-teal-700" checked={rights} onChange={(e) => setRights(e.target.checked)} />
          <span>I confirm I have the right to use this material for education, and it contains no unnecessary personal data about students.</span>
        </label>
        <Button type="submit" disabled={!file || !rights || busy}><Upload aria-hidden /> {busy ? "Uploading…" : "Upload and attach"}</Button>
      </form>
      {available.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="lib">Or attach from your knowledge library</Label>
            <Select id="lib" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Select a document…</option>
              {available.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
            </Select>
          </div>
          <Button variant="outline" disabled={!pick} onClick={async () => {
            const r = await api(`/api/studio/courses/${course.id}/sources`, "POST", { documentId: pick });
            if (!r.ok) return toast.error(errorText(r.data));
            setPick("");
            router.refresh();
          }}>Attach</Button>
        </div>
      )}
      {sources.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
          {sources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <FileText className="size-4 text-muted" aria-hidden />
              <span className="flex-1 font-medium">{s.filename}</span>
              {s.status === "ready" ? <Badge tone="green"><CheckCircle2 className="size-3" aria-hidden /> Ready{s.pageCount ? ` · ${s.pageCount} pages` : ""}</Badge>
                : s.status === "failed" ? <Badge tone="red"><XCircle className="size-3" aria-hidden /> Failed</Badge>
                : <Badge tone="amber"><Loader2 className="size-3 animate-spin" aria-hidden /> Processing</Badge>}
              {s.injectionFlags > 0 && <Badge tone="amber" title="Some passages contain instruction-like text. They are treated as data and ranked lower."><AlertTriangle className="size-3" aria-hidden /> {s.injectionFlags} flagged passage(s)</Badge>}
              {s.error && <p className="w-full text-red-700">{s.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OutlineEditor({ courseId, outline }: { courseId: string; outline: Outline }) {
  const router = useRouter();
  const [o, setO] = useState<Outline>(outline);
  const [busy, setBusy] = useState(false);
  const total = o.modules.reduce((n, m) => n + m.lessons.length, 0);
  const update = (fn: (draft: Outline) => void) => setO((prev) => { const d = structuredClone(prev); fn(d); return d; });

  async function save() {
    setBusy(true);
    const r = await api(`/api/studio/courses/${courseId}/outline`, "PUT", o);
    setBusy(false);
    if (!r.ok) { toast.error(errorText(r.data)); return false; }
    return true;
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="outline">
      <h2 id="outline" className="font-semibold">Step 5 · Review and approve the outline</h2>
      <p className="mt-1 text-sm text-muted">Edit titles and objectives, add or remove lessons. Lessons are only generated after you approve. ({total} lessons; max 24)</p>
      {o.notes && <Alert tone="info" className="mt-3">{o.notes}</Alert>}
      <ol className="mt-4 space-y-4">
        {o.modules.map((m, mi) => (
          <li key={mi} className="rounded-lg border border-line p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor={`m-${mi}`}>Module {mi + 1} title</Label>
                <Input id={`m-${mi}`} value={m.title} onChange={(e) => update((d) => { d.modules[mi].title = e.target.value; })} />
              </div>
              <Button variant="ghost" size="icon" aria-label={`Remove module ${mi + 1}`} disabled={o.modules.length === 1} onClick={() => update((d) => { d.modules.splice(mi, 1); })}><Trash2 /></Button>
            </div>
            <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
              {m.lessons.map((l, li) => (
                <li key={li} className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`l-${mi}-${li}`}>Lesson {li + 1}</Label>
                      <Input id={`l-${mi}-${li}`} value={l.title} onChange={(e) => update((d) => { d.modules[mi].lessons[li].title = e.target.value; })} />
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Remove lesson ${li + 1}`} disabled={m.lessons.length === 1} onClick={() => update((d) => { d.modules[mi].lessons.splice(li, 1); })}><Trash2 /></Button>
                  </div>
                  <Label htmlFor={`o-${mi}-${li}`} className="text-xs text-muted">Objectives (one per line)</Label>
                  <Textarea id={`o-${mi}-${li}`} rows={2} value={l.objectives.join("\n")} onChange={(e) => update((d) => { d.modules[mi].lessons[li].objectives = e.target.value.split("\n").slice(0, 6); })} />
                  <p className="text-xs text-muted">{l.sourceChunkIds?.length ?? 0} linked source passage(s)</p>
                </li>
              ))}
            </ol>
            <Button variant="ghost" size="sm" className="mt-2" disabled={m.lessons.length >= 8 || total >= 24} onClick={() => update((d) => { d.modules[mi].lessons.push({ title: "New lesson", objectives: [] }); })}><Plus aria-hidden /> Add lesson</Button>
          </li>
        ))}
      </ol>
      <Button variant="ghost" size="sm" className="mt-3" disabled={o.modules.length >= 8 || total >= 24} onClick={() => update((d) => { d.modules.push({ title: "New module", lessons: [{ title: "New lesson", objectives: [] }] }); })}><Plus aria-hidden /> Add module</Button>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-4">
        <Button variant="outline" disabled={busy} onClick={async () => { if (await save()) { toast.success("Outline saved"); router.refresh(); } }}>Save draft outline</Button>
        <ConfirmDialog
          trigger={<Button disabled={busy}><Wand2 aria-hidden /> Approve and generate lessons</Button>}
          title="Approve this outline?"
          description={`AI will draft ${total} lesson(s) with quizzes from your sources. You will review and edit everything before publishing.`}
          confirmLabel="Approve and generate"
          onConfirm={async () => {
            if (!(await save())) return;
            const r = await api(`/api/studio/courses/${courseId}/outline/approve`, "POST");
            if (!r.ok) return void toast.error(errorText(r.data));
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}

function Editor({ course, modules, previews, versions }: Props) {
  const router = useRouter();
  const lessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const [selected, setSelected] = useState(lessons[0]?.id);
  const lesson = lessons.find((l) => l.id === selected) ?? lessons[0];
  const failed = lessons.filter((l) => l.status !== "ready").length;
  const unpublished = course.publishedAt ? new Date(course.updatedAt) > new Date(course.publishedAt) : true;

  return (
    <div className="space-y-4">
      {failed > 0 && <Alert tone="warning">{failed} lesson(s) are not ready. Retry generation or edit them manually before publishing.</Alert>}
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <nav aria-label="Course outline" className="rounded-xl border border-line bg-surface p-3 xl:sticky xl:top-20 xl:max-h-[80dvh] xl:overflow-y-auto">
          {modules.map((m) => (
            <div key={m.id} className="mb-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">{m.title}</p>
              <ul className="mt-1">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={() => setSelected(l.id)} aria-current={l.id === lesson?.id ? "true" : undefined} className={cn("flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm cursor-pointer", l.id === lesson?.id ? "bg-teal-50 font-medium text-teal-700" : "hover:bg-bg")}>
                      <span className="flex-1">{l.title}</span>
                      {l.status !== "ready" && <XCircle className="size-4 text-red-700" aria-label="not ready" />}
                      {l.proposedRevision && <Sparkles className="size-4 text-amber" aria-label="pending AI suggestion" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {lesson && <LessonEditor key={lesson.id} lesson={lesson} preview={previews[lesson.id] ?? ""} language={course.language} />}
        {lesson && <AssistantPanel key={`a-${lesson.id}`} lesson={lesson} proposalHtml={previews[`proposal:${lesson.id}`]} />}
      </div>
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="publish">
        <div>
          <h2 id="publish" className="font-semibold">Step 8 · Publish</h2>
          <p className="text-sm text-muted">
            {versions[0] ? `Version ${versions[0].version} is live${unpublished ? "; you have unpublished edits." : "."}` : "Not published yet. Learners cannot see this course."}
          </p>
        </div>
        <div className="flex gap-2">
          {course.status === "published" && <Button asChild variant="outline"><Link href={`/academy/${course.slug}`}>View as learner</Link></Button>}
          <PublishButton courseId={course.id} nextVersion={(versions[0]?.version ?? 0) + 1} disabled={failed > 0 || course.status === "archived"} />
        </div>
      </section>
    </div>
  );
}

function PublishButton({ courseId, nextVersion, disabled }: { courseId: string; nextVersion: number; disabled: boolean }) {
  const router = useRouter();
  const [changelog, setChangelog] = useState("");
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="changelog">What changed</label>
      <Input id="changelog" placeholder="What changed? (optional)" value={changelog} onChange={(e) => setChangelog(e.target.value)} className="sm:w-60" />
      <ConfirmDialog
        trigger={<Button disabled={disabled}>Publish version {nextVersion}</Button>}
        title={`Publish version ${nextVersion}?`}
        description="Learners will see this version. It cannot be edited afterwards; later edits go into a new version."
        confirmLabel="Publish"
        onConfirm={async () => {
          const r = await api(`/api/studio/courses/${courseId}/publish`, "POST", { changelog: changelog || undefined, confirm: true });
          if (!r.ok) return void toast.error(errorText(r.data));
          toast.success(`Version ${r.data.version} published`);
          router.refresh();
        }}
      />
    </div>
  );
}

function LessonEditor({ lesson, preview, language }: { lesson: Lesson; preview: string; language: "en" | "ne" }) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [objectives, setObjectives] = useState(lesson.objectives.join("\n"));
  const [content, setContent] = useState(lesson.contentMd);
  const [minutes, setMinutes] = useState(lesson.estimatedMinutes);
  const [busy, setBusy] = useState(false);
  const dirty = title !== lesson.title || content !== lesson.contentMd || objectives !== lesson.objectives.join("\n") || minutes !== lesson.estimatedMinutes;

  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4">
      <Tabs defaultValue="edit">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="quiz">Quiz ({lesson.questions.length})</TabsTrigger>
          </TabsList>
          <Badge tone={lesson.origin === "ai" ? "amber" : "neutral"}>{lesson.origin === "ai" ? "AI draft" : "Edited"}</Badge>
        </div>
        <TabsContent value="edit" className="mt-4 space-y-3">
          <div><Label htmlFor="lt">Lesson title</Label><Input id="lt" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="lo">Objectives (one per line)</Label><Textarea id="lo" rows={2} value={objectives} onChange={(e) => setObjectives(e.target.value)} /></div>
          <div>
            <Label htmlFor="lc">Content (Markdown). Keep [n] markers to retain citations.</Label>
            <Textarea id="lc" rows={18} value={content} onChange={(e) => setContent(e.target.value)} className="font-mono text-sm" lang={language} />
          </div>
          <div className="w-32"><Label htmlFor="lm">Minutes</Label><Input id="lm" type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></div>
          <Button disabled={!dirty || busy} onClick={async () => {
            setBusy(true);
            const r = await api(`/api/studio/lessons/${lesson.id}`, "PATCH", { title, objectives: objectives.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6), contentMd: content, estimatedMinutes: minutes });
            setBusy(false);
            if (!r.ok) return toast.error(errorText(r.data));
            toast.success("Lesson saved to draft");
            router.refresh();
          }}>{busy ? "Saving…" : "Save lesson"}</Button>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <p className="mb-2 text-xs text-muted">Preview of the saved draft, as learners will see it after publishing.</p>
          <article lang={language} className="prose-lesson" dangerouslySetInnerHTML={{ __html: preview }} />
          {lesson.citations.length > 0 && (
            <ol className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
              {lesson.citations.map((c) => (
                <li key={c.n} id={`ref-${lesson.id}-${c.n}`}><span className="font-semibold">[{c.n}] {c.filename}{c.page ? `, p. ${c.page}` : ""}</span><blockquote className="text-muted">“{c.quote}”</blockquote></li>
              ))}
            </ol>
          )}
        </TabsContent>
        <TabsContent value="quiz" className="mt-4 space-y-4">
          {lesson.questions.length === 0 && <p className="text-sm text-muted">No quiz questions for this lesson.</p>}
          {lesson.questions.map((q, i) => <QuestionEditor key={q.id} q={q} index={i} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionEditor({ q, index }: { q: Question; index: number }) {
  const router = useRouter();
  const [s, setS] = useState(q);
  const dirty = JSON.stringify(s) !== JSON.stringify(q);
  return (
    <fieldset className="space-y-2 rounded-lg border border-line p-3">
      <legend className="px-1 text-sm font-semibold">Question {index + 1}</legend>
      <Label htmlFor={`qp-${q.id}`}>Prompt</Label>
      <Textarea id={`qp-${q.id}`} rows={2} value={s.prompt} onChange={(e) => setS({ ...s, prompt: e.target.value })} />
      {s.options.map((o, oi) => (
        <div key={oi} className="flex items-center gap-2">
          <input type="radio" name={`correct-${q.id}`} aria-label={`Option ${oi + 1} is correct`} checked={s.correctIndex === oi} onChange={() => setS({ ...s, correctIndex: oi })} className="size-4 accent-teal-700" />
          <Input aria-label={`Option ${oi + 1}`} value={o} onChange={(e) => setS({ ...s, options: s.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} />
        </div>
      ))}
      <Label htmlFor={`qe-${q.id}`}>Explanation</Label>
      <Textarea id={`qe-${q.id}`} rows={2} value={s.explanation} onChange={(e) => setS({ ...s, explanation: e.target.value })} />
      <Button size="sm" variant="outline" disabled={!dirty} onClick={async () => {
        const r = await api(`/api/studio/questions/${q.id}`, "PATCH", { prompt: s.prompt, options: s.options, correctIndex: s.correctIndex, explanation: s.explanation });
        if (!r.ok) return toast.error(errorText(r.data));
        toast.success("Question saved");
        router.refresh();
      }}>Save question</Button>
    </fieldset>
  );
}

function AssistantPanel({ lesson, proposalHtml }: { lesson: Lesson; proposalHtml?: string }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function request(operation: "simplify" | "shorten" | "key_points" | "custom", text: string) {
    setBusy(true);
    setNote(null);
    const r = await api(`/api/studio/lessons/${lesson.id}/revision`, "POST", { operation, instruction: text });
    setBusy(false);
    if (!r.ok) return toast.error(errorText(r.data));
    if (!r.data.applied) setNote(r.data.note);
    router.refresh();
  }

  return (
    <aside className="space-y-4 rounded-xl border border-line bg-surface p-4" aria-label="AI course assistant">
      <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-teal-700" aria-hidden /> Course assistant</h2>
      <p className="text-xs text-muted">Suggestions are shown for review. Nothing changes until you accept.</p>
      {lesson.proposedRevision ? (
        <div className="space-y-3">
          <Alert tone="info" title="Suggested revision">“{lesson.proposedRevision.instruction}”</Alert>
          <div className="prose-lesson max-h-80 overflow-y-auto rounded-lg border border-amber/40 bg-amber-50 p-3 text-sm" dangerouslySetInnerHTML={{ __html: proposalHtml ?? "" }} />
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => { await api(`/api/studio/lessons/${lesson.id}/revision/decision`, "POST", { accept: true }); toast.success("Revision applied to draft"); router.refresh(); }}><Check aria-hidden /> Accept</Button>
            <Button size="sm" variant="outline" onClick={async () => { await api(`/api/studio/lessons/${lesson.id}/revision/decision`, "POST", { accept: false }); router.refresh(); }}>Reject</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => request("simplify", "Simplify the language")}>Simplify</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => request("shorten", "Make it shorter")}>Shorten</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => request("key_points", "Add key points")}>Add key points</Button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (instruction.trim()) void request("custom", instruction.trim()); }} className="space-y-2">
            <Label htmlFor="instr">Ask for a change</Label>
            <Textarea id="instr" rows={3} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. Add an example from farming in Nepal" maxLength={600} />
            <Button type="submit" size="sm" disabled={busy || !instruction.trim()}>{busy ? "Working…" : "Suggest revision"}</Button>
          </form>
          {note && <Alert tone="warning">{note}</Alert>}
        </>
      )}
      <div className="border-t border-line pt-3">
        <h3 className="text-sm font-semibold">Sources cited in this lesson</h3>
        {lesson.citations.length === 0 ? <p className="text-xs text-muted">No citations.</p> : (
          <ul className="mt-2 space-y-2 text-xs">
            {lesson.citations.map((c) => <li key={c.n}><span className="font-semibold">[{c.n}] {c.filename}{c.page ? ` p.${c.page}` : ""}</span><span className="block text-muted">{c.quote.slice(0, 140)}…</span></li>)}
          </ul>
        )}
      </div>
    </aside>
  );
}
