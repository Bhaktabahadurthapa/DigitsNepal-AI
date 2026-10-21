"use client";

import { MessagesSquare, PanelRightClose, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, Badge, Spinner } from "@/components/ui/feedback";
import { Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Citation = { n: number; filename: string; quote: string; page?: number | null };
type Msg = { id: string; role: "user" | "assistant"; content: string; citations: Citation[]; grounded: boolean | null; rated?: boolean };

export function TutorPanel(props: { courseId: string; lessonId?: string; defaultLanguage: "en" | "ne"; history: { conversationId: string; messages: Msg[] } | null; standalone?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  if (props.standalone) return <TutorChat {...props} />;
  return (
    <>
      {open ? (
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-96 shrink-0 flex-col border-l border-line bg-surface xl:flex" aria-label={t.tutor.title}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <h2 className="font-semibold">{t.tutor.title}</h2>
            <Button variant="ghost" size="icon" aria-label={t.player.hideTutor} onClick={() => setOpen(false)}><PanelRightClose /></Button>
          </div>
          <TutorChat {...props} />
        </aside>
      ) : (
        <Button className="fixed bottom-6 right-6 z-20 hidden shadow-lg xl:inline-flex" onClick={() => setOpen(true)}><MessagesSquare aria-hidden /> {t.player.showTutor}</Button>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-4 right-4 z-20 shadow-lg xl:hidden"><MessagesSquare aria-hidden /> {t.player.showTutor}</Button>
        </DialogTrigger>
        <DialogContent title={t.tutor.title} side="right" className="p-0 pt-4 [&>div:first-child]:px-4">
          <TutorChat {...props} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TutorChat({ courseId, lessonId, defaultLanguage, history }: { courseId: string; lessonId?: string; defaultLanguage: "en" | "ne"; history: { conversationId: string; messages: Msg[] } | null }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>(history?.messages ?? []);
  const [conversationId, setConversationId] = useState(history?.conversationId);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<"en" | "ne">(defaultLanguage);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"llm" | "extractive" | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup.
    void endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);
  useEffect(() => {
    const on = (e: Event) => setQuizActive((e as CustomEvent).detail.active);
    window.addEventListener("dn:quiz", on);
    return () => window.removeEventListener("dn:quiz", on);
  }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setNotice(null);
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content: q, citations: [], grounded: null }]);
    setQuestion("");
    const r = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId, lessonId, conversationId, question: q, language }) });
    setBusy(false);
    if (!r.ok) {
      const err = (await r.json().catch(() => ({}))) as { error?: string };
      const map: Record<string, string> = {
        daily_limit: t.tutor.limit,
        rate_limited: t.tutor.limit,
        consent_required: t.tutor.consent,
        quiz_in_progress: t.player.tutorLockedQuiz,
        feature_disabled: t.tutor.budget,
      };
      setNotice(map[err.error ?? ""] ?? t.common.error);
      return;
    }
    const data = await r.json();
    setConversationId(data.conversationId);
    setMode(data.mode);
    setMessages((m) => [...m, { id: data.messageId, role: "assistant", content: data.answer, citations: data.citations, grounded: data.grounded }]);
  }

  async function rate(id: string, rating: 1 | -1) {
    await fetch("/api/tutor/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId: id, rating }) });
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, rated: true } : x)));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <p className="text-sm text-muted">{t.tutor.intro}</p>}
        {messages.map((m) => (
          <div key={m.id} className={cn("rounded-xl p-3 text-sm", m.role === "user" ? "ml-8 bg-navy text-white" : "mr-4 border border-line bg-bg")}>
            {m.role === "assistant" && m.grounded === false && <Badge tone="amber" className="mb-2">{t.tutor.notGrounded}</Badge>}
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.citations.length > 0 && (
              <ol className="mt-2 space-y-1 border-t border-line pt-2 text-xs text-muted">
                {m.citations.map((c) => (
                  <li key={c.n}>
                    <span className="font-semibold">[{c.n}] {c.filename}{c.page ? `, p. ${c.page}` : ""}</span>: “{c.quote.slice(0, 160)}{c.quote.length > 160 ? "…" : ""}”
                  </li>
                ))}
              </ol>
            )}
            {m.role === "assistant" && !m.id.startsWith("local") && (
              <div className="mt-2 flex gap-1">
                {m.rated ? (
                  <span className="text-xs text-muted">{t.tutor.thanks}</span>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" aria-label={t.tutor.helpful} onClick={() => rate(m.id, 1)}><ThumbsUp /></Button>
                    <Button variant="ghost" size="sm" aria-label={t.tutor.notHelpful} onClick={() => rate(m.id, -1)}><ThumbsDown /></Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <p className="flex items-center gap-2 text-sm text-muted"><Spinner label={t.tutor.thinking} /> {t.tutor.thinking}</p>}
        <div ref={endRef} />
      </div>
      <div className="space-y-2 border-t border-line p-3">
        {notice && <Alert tone="warning">{notice}</Alert>}
        {quizActive && <Alert tone="info">{t.player.tutorLockedQuiz}</Alert>}
        {mode === "extractive" && <p className="text-xs text-muted">Extractive mode: answers quote the course materials directly.</p>}
        <form onSubmit={ask} className="space-y-2">
          <label htmlFor="tutor-q" className="sr-only">{t.tutor.placeholder}</label>
          <Textarea
            id="tutor-q"
            rows={2}
            value={question}
            maxLength={1500}
            placeholder={t.tutor.placeholder}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={quizActive}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted">
              {t.tutor.answerIn}
              <Select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "ne")} className="h-9 w-auto text-sm">
                <option value="en">English</option>
                <option value="ne">नेपाली</option>
              </Select>
            </label>
            <Button type="submit" size="sm" disabled={busy || quizActive || !question.trim()}><Send aria-hidden /> {t.tutor.send}</Button>
          </div>
          <p className="text-xs text-muted">{t.tutor.disclaimer}</p>
        </form>
      </div>
    </div>
  );
}
