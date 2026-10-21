# Honen Page Inventory

Sources: REA accessibility snapshots, `https://honen.com/sitemap.xml`, and the public `llms.txt` index.
Evidence files live in `research/rea/honen/`. Each Evidence ID is the prefix of the full REA ID (see `*-summary.json`).

## Pages captured with REA

| Page | URL | Viewport(s) | Evidence ID | Screens | H1 (paraphrased) | Classification |
|---|---|---|---|---|---|---|
| Home | `/` | 1440×900 | `ev_99c0008842d2` (hero), `ev_b1c49cd0fd17` (menu + scroll) | 11 | "Teaching and learning infrastructure for anyone" | Observed |
| Home | `/` | 768×1024 | `ev_e6e346af2a8a` | 4 | same | Observed |
| Home | `/` | 390×844 | `ev_54d606fc273b` (scroll; *incomplete*), `ev_49df162e8fa7` (menu open) | 10 | same | Observed |
| Course Creation | `/features/course-creation` | 1440×900 | `ev_3487643ad234` | 7 | "Create and edit complete courses with AI" | Observed |
| Knowledge Base | `/features/knowledge-base` | 1440×900 | `ev_10f97bde985a` | 5 | "Your knowledge, ready to teach" | Observed |
| Learner Experience | `/features/learner-experience` | 1440×900 | `ev_62884f385b75` | 6 | "A learning experience that adapts to every learner" | Observed |
| Assignments | `/features/assignments` | 1440×900 | `ev_8e8d6bbe3540` | 4 | "Assign learning. See the results." | Observed |
| Analytics | `/features/analytics` | 1440×900 | `ev_ff45cf647b56` | 4 | "Analytics you get just by asking." | Observed |
| Docs home | `/docs` | 1440×900 | `ev_a4a40fdd467d` | 3 | "Build, teach, and learn with Honen." | Observed |

## Public documentation read (text only, not REA)

Saved under `research/rea/honen/docs-text/`: `course-creation.md`, `learner-experience.md`,
`publishing-and-review.md`, `knowledge-base.md`, `analytics-and-reporting.md`, `assignments.md`.
Classification: **Documented**.

## Site map (from sitemap.xml; not visited)

- **Audience pages:** pricing, learners, enterprise, workforce, small-business, government, higher-ed, k12, union, testing, accelerate
- **Features:** course-creation, learner-experience, analytics, assignments, knowledge-base, lms
- **Content:** projects (+7 project types), categories (~40 industry pages), browse/gallery, courses, curricula
- **Company:** blog, integrations, news, changelog, developers, mcp, about, contact, book, support
- **Legal:** terms, privacy, enterprise-terms, sponsored terms

## Repeated page template (Observed on all six feature pages)

1. Announcement bar (dismissible) → floating pill header
2. Two-column hero: H1 + paragraph + primary CTA ("Book a demo") + secondary text link ("See how it works"); a product mock on the right
3. 3–5 H2 "story" sections, each with a short paragraph and two or three supporting sub-points
4. "Great training. Built to last." tablist (Templates / Review queue / Agents & Automations)
5. Shared five-layer strip (Knowledge, Authoring, Learning, Delivery, Measurement) + two delivery cards
6. FAQ accordion (5 questions, each a `button` disclosing a paragraph)
7. "The latest from Honen" news cards → footer

**DigitsNepal adaptation:** we keep the *pattern* (hero → story sections → FAQ → footer) for
our product pages but use our own copy, structure, colours and illustrations. We do not
replicate the tablist or the five-layer strip verbatim; our homepage uses a five-step
mission journey (Learn → Practice → Build → Apply → Create Impact) instead.

## Navigation structure (Observed, desktop)

- **Header:** logo · Features ▾ · Solutions ▾ · Company ▾ · Language combobox · Log in · Book a demo
- **Features mega-menu** (`ev_b1c49cd0fd17`, step `features_menu`): 2-column grid of 6 items, each with an icon, a title and a one-line description (Learner Experience, Course Creation, Assignments, Analytics, Knowledge Base, Connect Your LMS)
- **Docs:** separate shell with left sidebar (Getting started, Knowledge Base, Creating content, Learning, Delivery, Governance, Administration, Agents and integrations, Adaptive learning), top tabs, search (⌘K), and a floating "Ask Honen" assistant button
