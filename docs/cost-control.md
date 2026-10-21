# Cost Control (target: USD 75–150/month pilot)

This is a **budget target, not a guarantee**. All figures are estimates; verify current prices before launch.

## Estimated monthly infrastructure (pilot, low traffic)

| Item | Option | Est. USD/month |
|---|---|---|
| Web | Vercel Hobby (non-commercial) → Pro if needed | 0–20 |
| Worker + AI service | 2 small containers (e.g. Fly.io shared-cpu, 512 MB) | 5–15 |
| Postgres + pgvector | Neon / Supabase starter | 0–25 |
| Object storage | Cloudflare R2 (≤10 GB, no egress) | 0–2 |
| Email | Transactional SMTP starter | 0–15 |
| DNS/WAF | Cloudflare free | 0 |
| Uptime monitoring | Free tier | 0 |
| **Subtotal (infra)** | | **~5–77** |
| AI API | Hard-capped in app (default $40) | ≤ cap |

## Application-level controls (enforced before every AI call)

| Control | Default | Where |
|---|---|---|
| Monthly hard cap (all AI spend) | `$40` | `AI_MONTHLY_BUDGET_USD` / Admin → Configuration |
| Soft-limit warning | 80% | logged + Admin banner |
| Over the cap | Tutor & Studio **degrade to the free extractive provider** (no paid calls) | `ai-guard.ts`, `x-dn-provider-override` |
| Tutor per user | 40/day, 6/min | quotas |
| Studio per educator | 10 outline generations/day, 5 AI actions/min | quotas |
| Lessons per course | ≤ 24 | outline schema |
| Outline context | ≤ 40 sampled passages × 1,800 chars | `generation.ts` |
| Lesson context | ≤ 8 passages | `generation.ts` |
| Tutor context | ≤ 5 retrieved passages + current lesson, ≤ 6 history turns | `tutor.ts` |
| Output tokens | ≤ 2,048 per call | `MAX_OUTPUT_TOKENS` |
| Kill switches | Tutor / Studio toggles | Admin → Configuration |
| Reuse | Generated lessons are stored; learners read cached content (no per-view AI cost) | by design |

These limits do **not** depend on provider billing alerts. Still, set a provider-side monthly limit as a second safety net.

## Rough AI usage model (verify prices!)

Assuming a "flash-lite"-class model at about $0.10 per 1M input tokens and $0.40 per 1M output tokens:
- Tutor message ≈ 2.5k input + 300 output tokens ≈ $0.00037 → 10,000 messages ≈ **$3.70**
- 20-lesson course generation ≈ 20 × (6k in + 1.5k out) + outline ≈ **$0.03**
- Embeddings for a 50-page PDF ≈ 40k tokens ≈ **<$0.01**

Even at 10× these prices a pilot of a few hundred learners stays well under the default $40 cap.

## Monitoring procedure

1. Weekly: Admin → AI usage. Check cost by feature/model, p95 latency, and job failure rate.
2. Monthly: reconcile with the provider invoice and update `PRICE_*` in the AI service env if they differ.
3. If spend approaches the soft limit early in the month: lower tutor quotas or switch the tutor to extractive mode.
