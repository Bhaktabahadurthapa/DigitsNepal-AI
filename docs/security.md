# Security, Privacy & AI Safety Checklist

Status legend: ✅ implemented and tested · 🟡 implemented, not tested (or only partially) · ⬜ not done.

## Application security

| Control | Status | Where / evidence |
|---|---|---|
| HTTPS + HSTS | 🟡 | `next.config.ts` sends HSTS in production builds. TLS termination is the host's job (Vercel/Cloudflare). Not verified on a real domain |
| Secure sessions | ✅ | Better Auth, httpOnly SameSite=Lax cookies; `Secure` when `BETTER_AUTH_URL` is https; 7-day expiry |
| Password policy | ✅ | 10–128 characters; scrypt hashing (Better Auth) |
| Password recovery | 🟡 | Reset-link flow implemented; email delivery needs `SMTP_URL` (dev logs links). Not E2E tested |
| Admin MFA | ✅ | `requireAdmin()` / `apiRole("admin")` require TOTP enabled (E2E: "administration requires two-factor…") |
| Server-side authorization | ✅ | `src/server/authz.ts` + `services/access.ts`; integration tests 1–13, E2E 13 |
| Tenant isolation | ✅ | Data-access layer checks; retrieval allow-lists; `tests/integration/isolation.test.ts` |
| Input validation | ✅ | Zod on every route handler; Pydantic in the AI service |
| File validation | ✅ | Extension allow-list, 10 MB limit, magic-byte sniffing, UTF-8 check, safe filenames (`files.test.ts`) |
| Malware scanning | 🟡 | ClamAV INSTREAM client (`scan.ts`); **disabled unless `CLAMAV_HOST` is set**. A skipped scan is recorded as `skipped`, never as `clean` |
| Private file storage | ✅ | Local dir outside `public/` or private S3 bucket; downloads only via the authorized route, as attachments |
| XSS | ✅ | React escaping; lesson Markdown sanitized with DOMPurify allow-list (`markdown.test.ts`); tutor output rendered as text |
| CSRF | ✅ | Same-origin check on every cookie-authenticated mutation (`route()` wrapper; E2E CSRF test); Better Auth's own origin checks |
| Rate limiting | ✅ | Auth endpoints (Better Auth, DB-backed); tutor/studio/upload/report/org-create (Postgres fixed windows; integration test) |
| Security headers / CSP | ✅ | CSP, frame-ancestors none, nosniff, referrer policy, permissions policy (E2E header test). CSP allows `'unsafe-inline'` scripts (Next.js bootstrap). Nonce-based CSP is future hardening |
| Audit logging | ✅ | `audit_events` for sign-up, roles, approvals, publishing, uploads/downloads, moderation, settings |
| Secret management | 🟡 | Env vars only; the production start refuses a missing/dev `BETTER_AUTH_SECRET`. Use the host's secret store; never commit `.env` |
| Least-privilege deploy credentials | ⬜ | Documented in `deployment.md`; not configured (no infrastructure access) |
| Backups & restore | 🟡 | Procedure in `deployment.md`; local `pg_dump` → `pg_restore` round-trip verified 2026-10-21 (row counts and vectors matched). Managed-provider PITR not configured |
| Dependency scanning | ⬜ | Recommend enabling Dependabot/`pnpm audit` in CI |

## Privacy (school users)

- Minimal data: name, email, learning records. Educators see learner **names and progress only**.
- Learners can self-declare "under 18". AI features stay blocked until an administrator records guardian/educator consent, with a note explaining how it was obtained (audited). ✅ integration-tested.
- No public learner profiles or leaderboards.
- Uploaders attest rights and "no unnecessary personal data" on every upload.
- The privacy notice and terms are **drafts**, not yet legally reviewed.

## AI safety

| Control | Status |
|---|---|
| Uploaded/retrieved text treated as untrusted data (delimited, system-prompt rule) | 🟡 implemented for LLM providers; not tested against a live LLM |
| Prompt-injection heuristics: flag at ingestion, rank lower, extractive provider skips tainted sources | ✅ eval suite 10/10 adversarial (extractive) |
| Citation validation (drop citations not backed by provided sources) | ✅ unit + eval tests |
| Refuse when information is missing | ✅ eval 5/5 + E2E |
| Tutor locked during quizzes | ✅ integration + UI |
| AI service has no DB, filesystem or network tools; only the configured model API | ✅ by design (code review) |
| Human approval before generation and before publishing; revisions are proposals | ✅ integration + E2E |
| Budget hard cap enforced in the app before every call (degrades to free extractive mode) | ✅ integration test |

## Responsible disclosure

See `SECURITY.md` at the repository root.
