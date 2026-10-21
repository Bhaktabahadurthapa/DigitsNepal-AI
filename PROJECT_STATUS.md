# DigitsNepal AI: Project Status

**As of 2026-10-21** · branch `feat/sprint-1-foundation` · not deployed · no git remote (CI never ran).

Legend: **Implemented and tested** = covered by an automated test that passed in this session ·
**Implemented but not tested** = code exists, no automated test · **Partial** · **Not started** · **Blocked**.

## First milestone

> An educator uploads an authorized PDF, generates and reviews a course, publishes it, and a learner
> completes a lesson and quiz with saved progress and a grounded AI Tutor.

**Implemented and tested** end to end (Playwright `milestone.spec.ts`, local production build, extractive AI
provider). It has **not** been demonstrated with a paid LLM or on a deployed environment.

## Verification run (this session)

| Check | Result |
|---|---|
| `pnpm lint` (web) | pass (1 warning) |
| `pnpm typecheck` (web) | pass |
| Vitest unit + integration (real Postgres) | **41/41 pass** |
| Playwright E2E (desktop + mobile, axe checks) | **14/14 pass** (covering all 15 required scenarios) |
| `next build` (production) | pass |
| AI service ruff + pytest | pass, **9/9** |
| AI evaluation suite (extractive) | **73/75** (2 failures documented in `docs/evaluation.md`) |
| Backup → restore round trip (local Docker Postgres) | pass |
| REA research captures (Honen, 11 scenarios) and REA visual QA of the local app (4 scenarios) | done |
| Re-verification after a Postgres restart (2026-10-21) | all of the above re-run and green; worker now survives DB restarts (verified by restarting the container under a running worker) |

## Feature status

| Area | Feature | Status | Evidence / notes |
|---|---|---|---|
| Research | REA analysis of Honen (desktop/tablet/mobile, docs) | Implemented and tested | `docs/rea/*`, evidence bundle in `research/rea/honen/` |
| Website | Homepage (hero, modules, journey, featured courses, Studio demo, impact, FAQ) | Implemented and tested | E2E 1, axe |
| Website | Responsive header + accessible mobile menu | Implemented and tested | E2E 15 |
| Website | EN/NE language switch | Implemented and tested | E2E "language switch" · Nepali copy pending native review |
| Website | About, Contact, Accessibility, Privacy (draft), Terms (draft), Community, Agent Lab, For Organizations | Implemented and tested | E2E 1 (HTTP 200) |
| Auth | Sign-up, sign-in, sign-out, sessions | Implemented and tested | E2E 2 |
| Auth | Password reset | Implemented but not tested | Needs SMTP; links logged in dev |
| Auth | Roles (learner/educator/admin), educator request + approval | Partial | Server checks tested; approval UI not E2E-tested |
| Auth | TOTP 2FA enrolment; admin requires MFA | Partial | Enforcement tested (E2E); enrolment UI not tested with a real authenticator |
| Academy | Catalog, course page, language filter, coming-soon labels | Implemented and tested | E2E 1, 3 |
| Learner | Enrollment, player, lesson completion, saved progress, resume | Implemented and tested | E2E 3, 9, 11 · integration 10–11 |
| Learner | Quizzes (server-graded, version-pinned) | Implemented and tested | E2E 10 · integration 10 |
| Learner | Flashcards | Implemented but not tested | Rendered when lessons have cards |
| Learner | Dashboard widgets (continue, enrolled, progress, completed, recommended, upcoming, quiz results) | Implemented and tested | E2E 11 (progress/quizzes pages); overview rendered in E2E 2 |
| Learner | Learning paths, My projects | Not started | Honest "coming soon" pages |
| Tutor | Grounded answers with citations (EN/NE), refusal when missing | Implemented and tested | E2E 12 · evals · integration 12–13 |
| Tutor | Feedback (👍/👎) | Implemented but not tested | Stored in `feedback`, visible in Admin → Reports |
| Tutor | Quotas, rate limits, budget fallback, quiz lock, minor-consent gate | Implemented and tested | integration (workflow + isolation) |
| Tutor | Standalone `/tutor` page | Implemented but not tested | |
| Studio | Wizard (type, details) | Implemented and tested | E2E 4–8 |
| Studio | Uploads: PDF/DOCX/MD/TXT validation, private storage, extraction, chunking, embeddings | Partial | PDF + TXT E2E-tested; DOCX extraction implemented, not tested; S3 driver not tested |
| Studio | Outline proposal, edit, approval gate | Implemented and tested | E2E 5–6 · integration "approval gates" |
| Studio | Durable jobs: progress, retry, cancel, recoverable errors | Implemented and tested | E2E 14 · integration "durable jobs" (cancel is UI-only, not tested) |
| Studio | Lesson + quiz generation with source citations | Implemented and tested | E2E 7–8, 12 (extractive). LLM path not tested |
| Studio | Manual editing of lessons and questions | Partial | Lesson title edit E2E-tested; question editor not tested |
| Studio | AI revision proposals (accept/reject) | Implemented but not tested | Extractive supports simplify/shorten/key points only |
| Studio | Versioned publishing (immutable snapshots) | Implemented and tested | E2E 8 · integration "published versions are immutable" |
| Educator | Dashboard + course table (Draft/Generating/In review/Published/Archived) | Implemented but not tested | Rendered in E2E navigation only |
| Educator | Knowledge library, assessments, learners, analytics | Implemented but not tested | |
| Org | Workspace request → admin activation, members, isolated library, drafts, review queue, activity log | Partial | Isolation tested (integration 3–4, 7); UI not E2E-tested; no invitations |
| Org | Report drafting workflow (records → draft → approval → export) | Not started | Labelled "Not started" in the UI |
| Admin | Users/roles, educator approvals, minor consent, course moderation, orgs, AI usage & cost, failed jobs, audit log, reports, configuration | Implemented but not tested | Admin-only access enforcement tested; individual admin actions not E2E-tested |
| Agent Lab | Directory with honest statuses, architecture diagram, contributor guide | Implemented and tested | E2E 1 (page loads, axe) |
| Community & impact | Information page, no fabricated numbers | Implemented and tested | E2E 1 |
| AI service | Extractive provider | Implemented and tested | pytest, evals, E2E |
| AI service | Gemini / OpenAI adapters | Implemented but not tested | **Blocked** on API keys |
| AI service | Google ADK | Not started | Deliberately deferred (`docs/ai.md`) |
| Security | Headers/CSP, CSRF, rate limits, validation, tenant isolation, audit | Implemented and tested | see `docs/security.md` |
| Security | Malware scanning | Implemented but not tested | Requires ClamAV |
| Observability | JSON logs, `/api/health` (DB, AI, queue depth), AI cost/latency dashboard | Partial | No error tracker/tracing |
| CI/CD | GitHub Actions workflow | Implemented but not tested | **Blocked**: no remote |
| Deployment | Staging/production | **Blocked** | No hosting, DB, storage or DNS credentials |
| Docs | Architecture, plan, audit, DB, AI, evaluation, security, deployment, cost, design system, roadmap | Done | `docs/` |

## Sprint summaries

- **Sprint 1 (foundation):** REA research, design system, homepage, schema + migrations, Better Auth, i18n. Tested.
- **Sprint 2 (courses & learners):** catalog, course page, enrollment, player, progress, quizzes, dashboard. Tested.
- **Sprint 3 (Studio):** uploads, extraction, outline, approval, generation, editor, revisions, publishing. Core path tested.
- **Sprint 4 (Tutor):** retrieval, grounded answers, Nepali, citations, feedback, quotas/budget. Core path tested.
- **Sprint 5 (readiness):** 41 integration/unit + 14 E2E tests, axe, eval suite, CI file, deployment/security/cost docs, backup verification. Deployment blocked.

## Exact external steps required

1. Create a GitHub repository and push this branch (`git remote add origin … && git push -u origin feat/sprint-1-foundation`); open a PR to `main`, and confirm CI passes.
2. Provision staging Postgres (pgvector), an R2 bucket, container hosting for worker + AI service, and Vercel (or container) hosting for web. Follow `docs/deployment.md`.
3. Provide an LLM API key (Gemini or OpenAI), verify model IDs and prices, then run `uv run python -m evals.run` with it.
4. Configure SMTP for password resets, and optionally ClamAV.
5. Arrange native-speaker review of Nepali text and educator review of starter courses.
6. After the staging checklist passes and the domain owner approves: configure Cloudflare DNS for digitsnepal.com.
