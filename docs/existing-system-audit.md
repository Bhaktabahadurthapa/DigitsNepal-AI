# Existing System Audit

**Date:** 2026-10-21 · **Working directory:** `/Users/bhaktathapa/Projects/digitsnepal-ai`

## Repository

| Check | Result |
|---|---|
| Files | Empty: only `.git/` existed |
| Commits | None (`master` had no commits) |
| Branches | `master` (unborn). Work is done on `feat/sprint-1-foundation` |
| Remotes | **None configured**, so nothing can be pushed and no CI runs until a remote is added |
| README / manifests / lockfiles / migrations / routes / CI | None |
| Existing deployment | Not discoverable from the repository. `digitsnepal.com` DNS/hosting was **not inspected** (no credentials; production DNS is out of scope) |

**Conclusion:** there is no existing application to preserve. A new application is created; there is nothing to migrate.

## Development environment

| Tool | Version | Notes |
|---|---|---|
| macOS | Darwin 27.0.0 (arm64) | |
| Node.js | 22.20.0 | |
| npm / pnpm | 10.9.3 / 10.27.0 | pnpm is used |
| Python | 3.12.5 (system), uv 0.11.28 | AI service uses uv |
| Docker | 29.0.1, Compose v2.40.3 | Docker Desktop was started during the audit |
| PostgreSQL client | `psql` not installed | Postgres runs in Docker (`pgvector/pgvector:pg16`) |
| Git | present | user "Bhakta" |
| Claude Code | `~/.local/bin/claude` | |
| REA | `rea-agents` **6.7.0** MCP server connected (207 tools); skill `reverse-engineer-anything` installed | No `rea` CLI on PATH; MCP tools used directly |
| Browsers | Google Chrome; Playwright Chromium builds 1228/1243/1248 | REA scenarios used the 1248 build |
| AI provider keys | **None present** in the environment (`GEMINI_*`, `GOOGLE_*`, `OPENAI_*` unset) | The app defaults to the offline `extractive` provider; see `docs/ai.md` |

## Implications

- Every AI feature must work without keys (deterministic extractive provider) so tests are reproducible
  and free, and switch to Gemini or OpenAI by environment variable.
- There is no remote, so the CI workflow is written but **has not run**.
- Deployment is documented, not executed (no Vercel, database or DNS credentials).
