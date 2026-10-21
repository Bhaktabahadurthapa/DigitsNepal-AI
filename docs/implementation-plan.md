# Implementation Plan

First milestone (the definition of done for this phase):
**An educator uploads an authorized PDF, generates and reviews a course, publishes it, and a learner
completes a lesson and quiz with saved progress and a grounded AI Tutor.**

## Sprint 1: Foundation
1. Monorepo (`pnpm` workspace): `apps/web`, `services/ai`, `docker-compose.yml`
2. Design system tokens + shadcn/ui primitives, bilingual dictionaries
3. Homepage and public pages (About, Contact, Accessibility, Privacy, Terms, Agent Lab, Organizations, Community)
4. Postgres + Drizzle schema and migrations; seed with reviewed sample courses
5. Better Auth: sign up/in/out, password reset (console or SMTP mailer), roles, admin TOTP

## Sprint 2: Course and learner system
Academy catalog → course detail → enroll → `/learn/[courseId]` player → lesson completion → quiz → progress → learner dashboard

## Sprint 3: AI Course Studio
Upload (validation, storage) → extraction job → chunking + embeddings → outline job → outline edit/approve →
lesson + quiz generation job → editor (manual edits, AI revision proposals) → preview → publish (versioned)

## Sprint 4: AI Tutor
Retrieval scoped to the course → grounded answer with citations → EN/NE → feedback (👍/👎) → quotas, rate limit, budget

## Sprint 5: Testing and launch readiness
Vitest unit/integration (incl. tenant isolation), pytest (AI service), Playwright E2E milestone + mobile,
axe accessibility checks, evaluation suite, CI workflow, deployment + security + cost docs, PROJECT_STATUS.md

## Explicitly deferred
Agent Lab workflows (information pages only), Organization workspace beyond the foundation (overview, members,
isolated library), NGO report agent, volunteers and impact reporting, voice tutor, media generation, LMS integrations.
