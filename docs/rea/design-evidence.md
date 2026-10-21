# Design Evidence Register

Every major finding is recorded with its source, viewport, evidence, confidence, limitations and adaptation.
Full Evidence IDs are in `research/rea/honen/*-summary.json`; screenshots are the PNGs next to them.

| # | Finding | Source URL | Viewport | Evidence (file / ID) | Class | Confidence | Limitations | DigitsNepal adaptation |
|---|---|---|---|---|---|---|---|---|
| 1 | Floating pill header, 3 mega-menu triggers, language select, Log in, solid CTA | / | 1440×900 | `home-desktop-settle.png` / `ev_99c0008842d2` | Observed | High | — | Sticky header with 6 product links, language toggle EN/ने, Sign in, Get Started |
| 2 | Features mega-menu: 2×3 icon + title + description grid | / | 1440×900 | `home-desktop-scroll-features_menu.png` / `ev_b1c49cd0fd17` | Observed | High | Solutions/Company menus not opened | Products listed directly in the nav (fewer than 7 items, so no mega-menu needed) |
| 3 | Mobile: hamburger opens an accordion panel with full-width Log in and CTA | / | 390×844 | `home-mobile-menu-menu_settle.png` / `ev_49df162e8fa7` | Observed | High | Accordion sub-items not expanded | Accessible disclosure menu (`aria-expanded`, Esc closes, focus management) |
| 4 | Tablet collapses nav to hamburger at 768px | / | 768×1024 | `home-tablet-s0.png` / `ev_e6e346af2a8a` | Observed | High | Breakpoint exact px unknown | Collapse below `lg` (1024px) |
| 5 | Course composer with type chips (Course/Assessment/Atom), Research, templates | /features/course-creation | 1440×900 | `course-creation-desktop-s0.png` / `ev_3487643ad234` | Observed (marketing mock) | Medium | Mock, not real app | Wizard step 1 type cards |
| 6 | "Approve the plan first." outline with Read/Flashcards/Quiz chips per topic | /features/course-creation | 1440×900 | `course-creation-desktop-p4.png` + a11y | Observed + Documented | High | Interaction not exercised | Outline review step with per-lesson editable rows |
| 7 | Build progress "Building your lessons… N of M ready" with per-type counters | /features/course-creation | 1440×900 | `course-creation-desktop-p5.png` | Observed (mock) | Medium | Mock | Job progress panel with polling |
| 8 | Citations: "Source 1: Team handbook" button + "Open cited passage" | /features/course-creation | 1440×900 | `course-creation-desktop-p5-a11y.txt` | Observed (a11y) | High | Not visually inspected | Numbered citation chips that open a passage popover |
| 9 | Learner player: lesson-plan button with progress, Back/Next, format selector, tutor controls | /features/learner-experience | 1440×900 | `learner-experience-desktop-s0.png` + a11y / `ev_62884f385b75` | Observed (embedded demo) | High | Demo iframe | `/learn/[courseId]` three-pane player |
| 10 | Feature pages end with a 5-item FAQ accordion | all feature pages | 1440×900 | a11y snapshots | Observed | High | — | FAQ on homepage/Studio page using `<details>` |
| 11 | KB: sources, agents keep content current, scoped workspace agents | /features/knowledge-base | 1440×900 | `ev_10f97bde985a` | Observed copy | High | Product not accessed | Knowledge Library in educator dashboard |
| 12 | Analytics: completion, scores, struggling topics; grading uses version taken | /features/analytics | 1440×900 | `ev_ff45cf647b56` | Observed copy | High | — | Store `course_version_id` on attempts |
| 13 | Docs: left nav tree + card grid + floating assistant | /docs | 1440×900 | `docs-desktop-s0.png` / `ev_a4a40fdd467d` | Observed | High | — | Agent Lab tutorial index uses a card grid |
| 14 | Completion based on real signals | docs | n/a | `docs-text/learner-experience.md` | Documented | Medium | Not exercised | v1 explicit completion at end of lesson |
| 15 | Assessment integrity: tutor tools withdrawn during tests | docs | n/a | `docs-text/learner-experience.md` | Documented | Medium | Not exercised | Tutor locked during an open quiz attempt |
| 16 | Destructive changes avoided: drafts → revisions → rollback | docs | n/a | `docs-text/course-creation.md` | Documented | Medium | — | Immutable `course_versions` |

## Explicit non-goals (copyright and brand)

- No Honen text is reused. The headlines on our pages are DigitsNepal's own, or the ones specified in the build brief.
- No screenshots are traced, and no screenshot-to-code generation is used.
- Different palette, typography pairing, iconography, logo, illustration style and layout proportions.
