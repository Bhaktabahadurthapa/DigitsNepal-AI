/** Typed client for the internal AI service (services/ai). */

export type AiSource = { id: string; filename: string; heading?: string | null; content: string; page?: number | null };
export type AiUsage = { provider: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; latency_ms: number };
export type AiCitation = { n: number; source_id: string; quote: string };

export type OutlineOut = {
  outline: { modules: { title: string; summary: string; lessons: { title: string; objectives: string[]; source_ids: string[] }[] }[]; notes: string };
  usage: AiUsage;
};
export type LessonOut = {
  content_md: string;
  citations: AiCitation[];
  flashcards: { front: string; back: string }[];
  quiz: { prompt: string; options: string[]; correct_index: number; explanation: string; source_id: string | null }[];
  usage: AiUsage;
};
export type TutorOut = { answer: string; citations: AiCitation[]; grounded: boolean; usage: AiUsage };
export type ReviseOut = { content_md: string; citations: AiCitation[]; applied: boolean; note: string; usage: AiUsage };
export type EmbedOut = { vectors: number[][]; dimensions: number; usage: AiUsage };

export class AiServiceError extends Error {
  constructor(
    public status: number,
    public retryable: boolean,
    message: string,
  ) {
    super(message);
  }
}

type Opts = { forceExtractive?: boolean; timeoutMs?: number };

async function call<T>(path: string, body: unknown, opts: Opts = {}): Promise<T> {
  const base = process.env.AI_SERVICE_URL ?? "http://localhost:8100";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 90_000);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.AI_SERVICE_TOKEN ?? ""}`,
        ...(opts.forceExtractive ? { "x-dn-provider-override": "extractive" } : {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new AiServiceError(503, true, `AI service unreachable: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 4xx = our request was invalid (do not retry); 5xx/502 = provider trouble (retry).
    throw new AiServiceError(res.status, res.status >= 500, `AI service ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export const ai = {
  embed: (texts: string[], task: "document" | "query", o?: Opts) => call<EmbedOut>("/v1/embed", { texts, task }, o),
  outline: (b: Record<string, unknown>, o?: Opts) => call<OutlineOut>("/v1/outline", b, o),
  lesson: (b: Record<string, unknown>, o?: Opts) => call<LessonOut>("/v1/lesson", b, o),
  tutor: (b: Record<string, unknown>, o?: Opts) => call<TutorOut>("/v1/tutor", b, { timeoutMs: 45_000, ...o }),
  revise: (b: Record<string, unknown>, o?: Opts) => call<ReviseOut>("/v1/revise", b, o),
  async health(): Promise<{ status: string; provider: string; embed_provider: string } | null> {
    try {
      const r = await fetch(`${process.env.AI_SERVICE_URL ?? "http://localhost:8100"}/health`, { signal: AbortSignal.timeout(3000) });
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  },
};
