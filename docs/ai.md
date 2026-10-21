# AI Service and Providers

`services/ai` is a stateless FastAPI service. It has **no database, filesystem or tool access**: it receives
already-authorized source passages, returns schema-validated JSON, and reports token usage.

| Endpoint | Purpose |
|---|---|
| `POST /v1/embed` | 768-dim embeddings for chunks and queries |
| `POST /v1/outline` | Course outline (modules → lessons → objectives → source ids) |
| `POST /v1/lesson` | Lesson Markdown + citations + flashcards + quiz |
| `POST /v1/tutor` | Grounded answer + citations + `grounded` flag |
| `POST /v1/revise` | Lesson revision *proposal* |
| `GET /health` | Provider status |

All `/v1/*` calls require `Authorization: Bearer $AI_SERVICE_TOKEN`. The header `x-dn-provider-override:
extractive` can only *downgrade* to the free provider; the app uses it when the monthly budget is exhausted.

## Providers

| `AI_PROVIDER` | What it is | Cost | Status |
|---|---|---|---|
| `extractive` (default) | Deterministic, LLM-free. Quotes source sentences verbatim, so citations are valid by construction; cloze quizzes; refuses when overlap is low | $0 | **Implemented and tested** (pytest, eval suite, E2E) |
| `gemini` | Gemini REST `generateContent` with `responseSchema`; embeddings via `gemini-embedding-001` @768 dims | Pay per token | **Implemented, NOT tested against the live API** (no key available during the build) |
| `openai` | Chat Completions with `json_schema`; `text-embedding-3-small` @768 dims | Pay per token | **Implemented, NOT tested against the live API** |

Model names and prices are configuration (`services/ai/.env`). **Verify current model IDs and prices**
before enabling a paid provider, then run the evaluation suite with that provider (see `evaluation.md`).

> Switching the **embedding** provider changes the vector space. Re-index all documents after changing
> `AI_EMBED_PROVIDER` (re-run extraction jobs). The `source_chunks.embedding_model` column records which model produced each vector.

## Why not Google ADK (yet)

Outline, lesson and tutor generation are each a single structured call over retrieved context. An agent loop
would add cost, latency and nondeterminism with no quality benefit at this stage. ADK is a good fit for
future multi-step tools (e.g. the NGO report agent: gather records → draft → human approval → export).

## Safety measures

1. Sources are wrapped in `<source id=…>` blocks; the system prompt says source text is data, never instructions.
2. Heuristic injection detection (`app/safety.py`, mirrored in `apps/web/src/server/services/safety.ts`): flagged chunks are shown to educators, ranked lower in retrieval, and excluded entirely by the extractive provider.
3. Output validation: Pydantic schemas; one repair retry; citations whose source id is not in the request or whose quote is not in the source are dropped, and their `[n]` markers removed.
4. The tutor is told to refuse when the sources do not contain the answer; `grounded` is forced to false if no valid citation remains.
5. Tutor tools are disabled while a quiz attempt is open (enforced server-side).
6. AI output is never published automatically. Revisions are proposals; publishing is a human action.
