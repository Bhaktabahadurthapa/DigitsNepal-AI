# DigitsNepal AI: Architecture

## Overview

```
                ┌──────────────────────────── Browser (EN / ने) ────────────────────────────┐
                │  Public site · Academy · Learner dashboard · Course player · AI Tutor       │
                │  Educator dashboard · AI Course Studio · Admin                              │
                └───────────────┬────────────────────────────────────────────────────────────┘
                                │ HTTPS (session cookie, CSRF-safe same-origin APIs)
┌───────────────────────────────▼──────────────────────────────┐
│ apps/web: Next.js (App Router, TypeScript)                   │
│  • Server Components + Route Handlers (/api/*)               │
│  • Better Auth (email+password, sessions, TOTP 2FA)          │
│  • Data-access layer (src/server/dal) enforces authz and     │
│    tenant (organization) isolation for EVERY query           │
│  • AI guard: quotas, rate limits, monthly budget             │
│  • Storage driver: local FS (dev) | S3-compatible (prod)     │
└──────┬─────────────────────────────┬─────────────────────────┘
       │ SQL (Drizzle)               │ enqueue jobs (rows)
┌──────▼─────────────┐   ┌───────────▼──────────────────────────┐
│ PostgreSQL 16      │◄──┤ apps/web worker (Node, same codebase)│
│ + pgvector         │   │  claims jobs with FOR UPDATE SKIP    │
│ (jobs = durable    │   │  LOCKED; extract → chunk → embed;    │
│  queue table)      │   │  outline; lessons/quizzes            │
└────────────────────┘   └───────────┬──────────────────────────┘
                                     │ HTTP + shared secret (internal only)
                         ┌───────────▼──────────────────────────┐
                         │ services/ai: FastAPI (Python)        │
                         │  /v1/embed  /v1/outline  /v1/lesson  │
                         │  /v1/quiz   /v1/tutor    /v1/revise  │
                         │  Providers: extractive | gemini |    │
                         │  openai; Pydantic-validated JSON     │
                         │  outputs; token + cost accounting    │
                         └──────────────────────────────────────┘
```

## Key decisions

| Decision | Choice | Reason |
|---|---|---|
| Web framework | Next.js App Router + TypeScript, Tailwind CSS v4, shadcn/ui (Radix) | As specified; one deployable unit for UI + API |
| Auth | **Better Auth** (maintained, self-hosted, Drizzle adapter, built-in rate limiting, TOTP 2FA plugin) | No per-user SaaS fees; data stays in our Postgres |
| DB | PostgreSQL + Drizzle ORM + pgvector | As specified |
| Queue | Postgres `generation_jobs` table + Node worker using `SKIP LOCKED` | Durable, no Redis bill, transactional with app data |
| AI service | FastAPI, stateless; the web/worker owns all DB access | The AI service never sees credentials for user data, which limits the blast radius of prompt injection |
| Agent framework | **Google ADK not used in v1** | Outline, lesson and tutor calls are single structured LLM calls; an agent loop adds cost and nondeterminism with no benefit yet. Revisit for Agent Lab / NGO report agent |
| Embeddings | 768-dim vectors (Gemini `gemini-embedding-001` @768, OpenAI `text-embedding-3-small` @768, or the offline hashing embedder) | One column size for every provider |
| Offline provider | `extractive`: deterministic and LLM-free. Builds outlines from document structure, lessons from cited source passages, cloze quizzes, extractive tutor answers | Free reproducible tests; a usable fallback when the budget is exhausted |
| File storage | `STORAGE_DRIVER=local` (private dir outside `public/`) or `s3` (R2/MinIO/S3) | Private; downloads only via an authorized route |
| i18n | Cookie-based locale (`en` / `ne`), typed dictionaries | Simple; no URL rewriting |

## Trust boundaries & AI safety

1. **Uploaded documents are untrusted data.** They are wrapped in delimited `<source id=…>` blocks; the
   system prompt states that source text cannot change instructions. A heuristic injection detector flags
   chunks with instruction-like text (`ignore previous instructions`, `system prompt`, …). Flagged chunks are
   shown to educators and down-weighted in retrieval.
2. **Retrieval is permission-scoped in SQL**: the tutor only searches chunks of source documents
   linked to the course the learner is enrolled in (published version). Org-private documents never cross orgs.
3. **The AI service has no DB, filesystem or network tools.** It only transforms the input it is given.
4. **Human gates:** outline approval → generation; educator edits; publish (educator owner or admin);
   AI revisions are proposals that must be accepted.
5. **Budget enforcement** happens in the app before each AI call (per-user daily, per-org monthly, global
   monthly hard cap) and uses token estimates up front plus actual usage afterwards.

## Data model (summary)

See `apps/web/src/server/db/schema.ts` and `docs/database.md`. Core tables: users (Better Auth),
profiles, roles, organizations, organization_members, courses, course_versions, modules, lessons,
assessments, questions, enrollments, progress, quiz_attempts, source_documents, source_chunks,
course_sources, generation_jobs, ai_conversations, ai_messages, review_decisions, audit_events,
usage_records, feedback, rate_limits.

## Course lifecycle

```
draft ──(sources ready + outline requested)──► generating(outline) ──► draft (outline_proposed)
  │ educator edits + APPROVES outline (server gate)
  ▼
generating(lessons) ──► in_review ──(educator edits)──► publish ──► published (course_version N, immutable)
                                                          │
                      archived ◄──────────────────────────┘
```

Learners always read the **latest published `course_version`** snapshot. Edits to the working draft
never affect learners until the next publish.
