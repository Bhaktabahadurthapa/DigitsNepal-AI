# Deployment Guide

> **Status:** nothing has been deployed. No cloud, DNS or CI credentials were available during the build.
> Everything below is prepared and locally verified where noted; each external step must be done by an
> operator. **Deploy to staging first.** Do not change production DNS until the staging checklist passes.

## Target architecture (pilot)

| Component | Recommended service | Notes |
|---|---|---|
| Web app (Next.js) | Vercel (Hobby/Pro) **or** a container host | `apps/web` |
| Worker | Container host (Fly.io / Railway / Render / Cloud Run) | Same image as web, command `pnpm worker`. Must run continuously |
| AI service | Container host, **private network only** | `services/ai/Dockerfile`; reachable only by web + worker |
| PostgreSQL 16 + pgvector | Neon / Supabase / Crunchy / RDS | Enable PITR backups |
| Object storage | Cloudflare R2 (no egress fees) or S3 | Private bucket, SSE on |
| DNS / WAF | Cloudflare | Proxy on, TLS Full (strict), bot protection on `/api/auth/*` |
| Email | Any SMTP provider (e.g. Postmark, SES) | For password resets |

No Kubernetes. The worker cannot run on Vercel serverless functions; it needs a long-running container.

## Environment variables

### Web + worker (`apps/web`)

| Variable | Required | Example / default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `postgres://…?sslmode=require` | Postgres connection |
| `BETTER_AUTH_URL` | ✅ | `https://digitsnepal.com` | Public base URL (cookies, links) |
| `BETTER_AUTH_SECRET` | ✅ | `openssl rand -base64 32` | Session signing; startup fails if missing or a dev value |
| `AI_SERVICE_URL` | ✅ | `http://ai.internal:8100` | Private AI service URL |
| `AI_SERVICE_TOKEN` | ✅ | random 32+ bytes | Shared secret with the AI service |
| `STORAGE_DRIVER` | ✅ | `s3` | `local` only for development |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | ✅ (s3) | R2 values | Scoped key: read/write on one bucket only |
| `SMTP_URL`, `EMAIL_FROM` | ✅ prod | `smtps://…` | Password-reset email (production refuses to send without it) |
| `ADMIN_EMAILS` | first deploy | `you@digitsnepal.com` | Bootstrap admins on sign-up; remove afterwards |
| `AI_MONTHLY_BUDGET_USD` | | `40` | Hard cap (admin can override in UI) |
| `AI_MONTHLY_SOFT_LIMIT_RATIO` | | `0.8` | Warning threshold |
| `AI_TUTOR_DAILY_MESSAGES_PER_USER`, `AI_TUTOR_PER_MINUTE_PER_USER`, `AI_STUDIO_DAILY_GENERATIONS_PER_USER` | | `40`, `6`, `10` | Quotas |
| `UPLOAD_MAX_BYTES` | | `10485760` | Upload limit |
| `SOURCE_RETENTION_DAYS` | | `365` | Retention stamp on uploads |
| `CLAMAV_HOST` | recommended | `clamav.internal:3310` | Enables malware scanning |
| `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` | | | Footer/contact links (build-time) |
| `DATABASE_POOL_MAX` | | `10` | Lower (e.g. 3) on serverless |

### AI service (`services/ai`)

| Variable | Default | Purpose |
|---|---|---|
| `AI_SERVICE_TOKEN` | — | Must match the web app |
| `AI_PROVIDER` | `extractive` | `extractive` \| `gemini` \| `openai` |
| `AI_EMBED_PROVIDER` | `extractive` | Changing it requires re-indexing documents |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBED_MODEL` | | Verify current model IDs |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBED_MODEL` | | Verify current model IDs |
| `PRICE_INPUT_PER_MTOK`, `PRICE_OUTPUT_PER_MTOK`, `PRICE_EMBED_PER_MTOK` | 0.10 / 0.40 / 0.15 | **Set to your provider's current prices**. Cost reports depend on them |
| `MAX_OUTPUT_TOKENS` | `2048` | Caps output cost per call |

## Database migrations

```bash
cd apps/web
DATABASE_URL=<staging> pnpm db:migrate      # run before deploying new code
```
Run migrations from CI or a one-off container **before** the new web version takes traffic. Migrations are
additive by policy (see `database.md`). Then seed the Academy once: `DATABASE_URL=<…> pnpm db:seed`
(idempotent; never set `SEED_DEMO_USERS` outside development).

## Step-by-step: staging

1. Create a Postgres database; run `CREATE EXTENSION vector;` if the provider requires manual enabling.
2. Create the private R2 bucket and a bucket-scoped API token.
3. Deploy `services/ai` (Docker) on a private network, setting `AI_SERVICE_TOKEN` and `AI_PROVIDER=extractive` at first.
4. Build and deploy `apps/web` with all env vars. Run migrations and the seed.
5. Deploy the worker (same image, `pnpm worker`) with the same env vars.
6. Point `staging.digitsnepal.com` at the web app (Cloudflare CNAME, proxied).
7. Sign up with an `ADMIN_EMAILS` address, enable TOTP in Settings → Security, then remove `ADMIN_EMAILS`.
8. Run the staging checklist below. Then (optional) set `AI_PROVIDER=gemini` with a key, run the eval suite, and compare.

### Staging checklist (all must pass before production)

- [ ] `GET /api/health` → `{"status":"ok","database":"ok","ai":{"status":"ok"}}`
- [ ] Playwright suite against staging (`E2E_BASE_URL` support would need a small config change; or run the manual milestone flow)
- [ ] Upload → outline → approve → generate → publish → learner completes lesson + quiz → tutor cites the PDF
- [ ] Admin area requires TOTP
- [ ] Response headers include HSTS and the CSP
- [ ] Backup created and **restored into a scratch database** (see below)
- [ ] Budget page shows spend; quotas tested with a low temporary limit

## Domain and HTTPS (production)

Only after staging passes, and with the domain owner's approval:
1. In Cloudflare, add `digitsnepal.com` and `www` records to the web host (proxied), SSL mode **Full (strict)**.
2. Set `BETTER_AUTH_URL=https://digitsnepal.com` and redeploy.
3. Enable "Always Use HTTPS". HSTS is already sent by the app; only add it in Cloudflare too once you are sure HTTPS works for all subdomains.

## CI/CD

`.github/workflows/ci.yml` runs: AI service lint + tests + evaluation suite (extractive, $0), web lint,
typecheck, unit/integration tests against Postgres, production build, and the full Playwright E2E suite.
**It has not run yet**: the repository has no remote. Recommended CD: Vercel Git integration for web
(preview per PR, production on `main`), and a deploy job for worker + AI images gated on CI success.

## Monitoring

- **Health:** uptime check on `/api/health` every minute (Better Stack/UptimeRobot free tiers).
- **Logs:** structured JSON on stdout (web, worker, AI service). Ship to the host's log drain. Document contents are never logged.
- **AI cost & latency:** Admin → AI usage (per feature/model; p50/p95 latency; job failure rate).
- **Queue depth:** `/api/health.queueDepth` and Admin overview. Alert if > 50 for 15 minutes.
- **Errors:** add Sentry (or similar) DSN as a follow-up. Not yet integrated.
- **Traces:** not yet implemented (OpenTelemetry via `instrumentation.ts` is the planned path).

## Backup and restore

Managed Postgres: enable daily backups + point-in-time recovery (≥7 days). Additionally, weekly logical dumps:

```bash
pg_dump "$DATABASE_URL" -Fc -f digitsnepal-$(date +%F).dump          # backup
createdb restore_check && pg_restore -d restore_check --no-owner digitsnepal-YYYY-MM-DD.dump   # restore test
psql -d restore_check -c "select count(*) from users; select count(*) from source_chunks where embedding is not null;"
```
Verified locally on 2026-10-21: counts (users, courses, versions, chunks, embeddings) matched after restore.
Object storage: enable bucket versioning or a daily sync to a second bucket. Restore = copy objects back.

## Rollback

1. **App:** redeploy the previous build (Vercel "Promote" or previous image tag). Web and worker must run the same version.
2. **Database:** migrations are additive, so the previous app version keeps working. If data is damaged, restore PITR into a *new* database, verify it, then switch `DATABASE_URL`. Never restore over production in place.
3. **AI provider problems:** set `AI_PROVIDER=extractive` (no deploy of the web app needed) or disable Tutor/Studio in Admin → Configuration.

## Cost monitoring procedure

See `cost-control.md`. Weekly: compare Admin → AI usage cost with the provider invoice and adjust `PRICE_*`.
