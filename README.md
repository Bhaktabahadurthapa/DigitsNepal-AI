# DigitsNepal AI

**Learn AI. Build Agents. Transform Nepal.** · **एआई सिकौँ। एआई एजेन्ट बनाऔँ। नेपाललाई डिजिटल बनाऔँ।**

A bilingual (English/Nepali), AI-assisted learning platform: a free Academy, an AI Course Studio that turns
approved documents into reviewed courses, and a grounded AI Tutor that cites its sources.

> Status: pilot-stage software, **not deployed**. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for exactly what is implemented and tested.

## Repository

```
apps/web/        Next.js 16 (App Router, TypeScript, Tailwind v4, Radix) · Drizzle ORM · Better Auth · job worker
services/ai/     FastAPI AI service: extractive (offline), Gemini, OpenAI providers · evaluation suite
docs/            Architecture, REA research, security, deployment, cost, evaluation, design system, roadmap
research/rea/    REA evidence (screenshots, accessibility snapshots, evidence bundle)
```

## Quick start (local)

Requirements: Node 22 + pnpm 10, Python 3.12 + uv, Docker.

```bash
docker compose up -d db                       # Postgres 16 + pgvector on :5433
pnpm install
cp apps/web/.env.example apps/web/.env
cp services/ai/.env.example services/ai/.env
pnpm db:migrate
SEED_DEMO_USERS=1 pnpm db:seed                # Academy content + demo accounts (dev only)

(cd services/ai && uv sync && uv run uvicorn app.main:app --port 8100)   # terminal 1
pnpm dev                                                                 # terminal 2 → http://localhost:3000
pnpm worker                                                              # terminal 3 (background jobs)
```

Demo accounts (development only): `learner@demo.digitsnepal.local` and `educator@demo.digitsnepal.local`, password `demo-password-123`.
To become an admin, set `ADMIN_EMAILS` in `apps/web/.env` before signing up, then enable TOTP in Settings → Security.

The default AI provider is **extractive**: free and offline, and it quotes sources verbatim. To use an LLM, set
`AI_PROVIDER=gemini` (or `openai`) plus the API key in `services/ai/.env`. Read [docs/ai.md](docs/ai.md) first.

## Tests

```bash
cd apps/web
pnpm lint && pnpm typecheck
pnpm test        # unit + integration (needs the digitsnepal_test DB and the AI service on :8100)
pnpm e2e         # Playwright; starts its own AI service, production build and worker on :3100/:8101
cd ../../services/ai && uv run pytest && uv run python -m evals.run
```
Create test databases once: `docker exec digitsnepal-ai-db-1 psql -U digitsnepal -c "CREATE DATABASE digitsnepal_test" -c "CREATE DATABASE digitsnepal_e2e"`,
then migrate each with `DATABASE_URL=… pnpm db:migrate`.

## Documentation

- [Architecture](docs/architecture.md) · [Implementation plan](docs/implementation-plan.md) · [Existing system audit](docs/existing-system-audit.md)
- [REA research on the reference product](docs/rea/honen-analysis.md) · [Visual QA](docs/rea/digitsnepal-visual-qa.md)
- [Database](docs/database.md) · [AI service](docs/ai.md) · [Evaluation](docs/evaluation.md)
- [Security checklist](docs/security.md) · [Deployment](docs/deployment.md) · [Cost control](docs/cost-control.md)
- [Design system](docs/design-system.md) · [Limitations & roadmap](docs/roadmap.md)

DigitsNepal is a community initiative in its pilot stage. It is not a registered charity.
