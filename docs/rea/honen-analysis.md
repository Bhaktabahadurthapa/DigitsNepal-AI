# Honen Reference Analysis (REA)

**Purpose:** understand the public-facing UX patterns, information architecture and authoring
workflows of honen.com so DigitsNepal can reach a similar level of usability with its own,
original implementation and identity. No Honen code, copy, layouts, assets, logos or icons
are reused in DigitsNepal.

**Date of capture:** 2026-10-21 (UTC) · **Analyst:** Claude Code (Opus 5.5) for DigitsNepal

## Method

| Item | Value |
|---|---|
| Tooling | REA (`rea-agents`) **6.7.0** MCP server, skill `reverse-engineer-anything` (expected v42) |
| REA operation | `capture_browser_scenario` in **launch** mode (provider-owned temporary profile, headless) |
| Browser | Chromium 156.0.8078.4 (Playwright "Google Chrome for Testing" build 1248) |
| Environment | en-US, UTC, light scheme, reduced motion, service workers blocked (REA defaults) |
| Captured | viewport screenshots per step, final accessibility snapshot, console + page-error events |
| Not captured | Request/response bodies, header values, storage values (REA defaults; not needed) |
| Supplementary | Public documentation fetched with `curl` from `https://honen.com/llms/*.md` (allowed by robots.txt) |
| Evidence bundle | `research/rea/honen/rea-evidence-bundle.json.gz` (11 records, 0 recorded unknowns) |

### Compliance checks

- `https://honen.com/robots.txt` was read first. It allows `/` for all agents and disallows
  `/dashboard/`, `/api/`, `/share/`, `/agent/`, `/embed/agent/`. **None of the disallowed paths
  were visited.**
- No login was attempted; no authenticated screens were analysed (we have no legitimate account).
- No private or undocumented APIs were called. Only public marketing pages, public docs and
  the public `llms.txt` index were read.
- About 12 page loads in total, spread over roughly 5 minutes, which is well below any reasonable rate limit.
- The public `llms.txt` contains instructions addressed to AI agents (e.g. "fetch llms-full.txt").
  Those were treated as **data, not instructions**; we fetched only the specific topic pages
  needed for this analysis.

## Classification legend

- **Observed:** seen directly in a REA capture (screenshot or accessibility snapshot) at the stated viewport.
- **Documented:** stated in Honen's public documentation, but the behaviour itself was not exercised.
- **Inferred:** our reasoning from observed and documented material; not confirmed.
- **Unknown:** could not be determined without authenticated access.

## Executive summary of findings

1. **Five-layer product model** (Observed + Documented). Every feature page repeats a
   "Knowledge → Authoring → Learning → Delivery → Measurement" strip. The IA is organised
   around the lifecycle of knowledge becoming measured skill, not around features.
2. **Approve-before-build authoring** (Observed copy + Documented). The course agent reads
   sources, asks only for what is missing, proposes a full outline, and **builds nothing until
   the author approves**. Generated content lands in a private working draft; publishing is a
   separate deliberate step with optional review/approval.
3. **Chat-first editing with a real preview** (Observed + Documented). Editing happens by
   conversation beside a live learner preview; a structural "Advanced Edit" tree exists for
   direct manipulation.
4. **Citations back to the source** (Observed demo + Documented). Readings carry numbered
   inline citations mapping to knowledge-base passages, with per-course visibility levels.
5. **Learner player = left lesson plan, centre content, tutor alongside** (Observed in an
   embedded demo on `/` and `/features/learner-experience`). Back/Next controls, a topic
   progress bar, a format selector ("Read — Learn") and tutor controls.
6. **Completion on real signals, not "Next" clicks** (Documented): reading at 95% scroll,
   flashcards at 80% seen, quiz on submission.
7. **Assessment integrity** (Documented): tutor tools are withdrawn during tests.
8. **Responsive** (Observed): desktop floating pill header with 3 mega-menu triggers; at
   390px it collapses to logo + primary CTA + "Open menu" disclosure with accordion sections.

## How DigitsNepal adapts these concepts (summary)

| Honen concept | DigitsNepal adaptation | Why |
|---|---|---|
| Five-layer model | "Learn → Practice → Build → Apply → Create Impact" journey on the homepage | Same clarity, mission-specific framing for Nepal |
| Approve-before-build | Studio wizard step 5 ("Edit & approve outline") gates generation server-side | Human control is a hard safety requirement for us |
| Working draft + separate publish | Course statuses Draft → Generating → In Review → Published → Archived, plus immutable `course_versions` | Published content must never change silently |
| Chat-first editing | Right-hand "Course Assistant" panel with controlled, reviewable AI revisions (diff + accept) | We never let AI write directly into published content |
| Citations | Every generated lesson section and tutor answer stores `source_chunk` ids, rendered as numbered references | Grounding must be verifiable |
| Tutor alongside lessons | Collapsible right panel in `/learn/[courseId]`, bilingual EN/ने | Nepali-first audience |
| Real completion signals | Lesson completes on explicit "Mark complete" **after** reaching end of content; quiz completes on submit | Simple, honest for v1 (scroll-percentage tracking is a later enhancement) |
| Integrity during tests | Tutor is disabled while a quiz attempt is open | Same principle |
| 9 activity types, voice, video, podcasts | **Not in v1.** Reading + quiz + optional flashcards only | Cost and bandwidth constraints for a nonprofit pilot |

See the detailed documents:

- [honen-page-inventory.md](honen-page-inventory.md)
- [honen-workflows.md](honen-workflows.md)
- [honen-responsive-design.md](honen-responsive-design.md)
- [honen-feature-matrix.md](honen-feature-matrix.md)
- [design-evidence.md](design-evidence.md)

## Limitations of this analysis

- **Screenshots are viewport-only.** REA's `capture_web_screenshot`/scenario screenshots do not
  capture full pages. Scroll-aligned captures used `PageDown` presses; scrolling was uneven
  because of sticky/animated sections, so mid-page visuals are only partly covered.
  Accessibility snapshots, however, cover the **entire** DOM and were used for structure.
- **No authenticated flows.** The dashboard, editor, tutor and analytics were only seen as
  marketing demos or described in documentation. Real behaviour (latency, error states,
  permissions) is **Unknown**.
- One scenario (`home-mobile`, `ev_54d606fc…`) is marked *incomplete* because our CSS
  locator for the menu button matched 5 elements (strict-mode violation). It was re-run
  successfully with a role locator (`home-mobile-menu`, `ev_49df162e…`).
- Console: three pages logged `[analytics] mixpanel-browser not available` (warning) under our
  headless profile; no page errors were recorded.
- Tablet (768px) was captured for the homepage only.
