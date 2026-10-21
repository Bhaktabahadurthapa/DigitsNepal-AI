# DigitsNepal Design System

Original system for DigitsNepal. Inspired by general educational-SaaS principles observed during
research (see `docs/rea/`), **not** by any specific product's visuals.

## Tokens (`apps/web/src/app/globals.css`)

| Token | Value | Use | Contrast on white |
|---|---|---|---|
| `navy` | `#0D2338` | Brand, headings, dark sections | 15.6:1 |
| `teal-700` | `#0F766E` | Primary buttons, links, active states | 5.4:1 ✅ AA |
| `teal` | `#0D9488` | Decorative accents, progress fill, focus ring | 3.7:1 (not for text) |
| `red` / `red-700` | `#DC2626` / `#B91C1C` | Destructive actions, errors | 4.8:1 / 6.5:1 |
| `bg` | `#F8FAFC` | Page background | — |
| `ink` | `#0F172A` | Body text | 17.9:1 |
| `muted` | `#64748B` | Secondary text | 4.8:1 ✅ AA |

> E2E axe checks caught white text on `teal` (#0D9488, 3.7:1) in the hero CTA. It was changed to
> `teal-700`. `teal` is now used only for non-text accents.

Typography: **Inter** (Latin) and **Noto Sans Devanagari** (Nepali), both self-hosted at build time with
`next/font`. Nepali text is marked `lang="ne"` and gets line-height 1.75 for vowel signs.

## Components (`apps/web/src/components/ui`)

| Component | File | Notes |
|---|---|---|
| Button (primary, navy, outline, ghost, danger, link, on-dark) | `button.tsx` | ≥44px touch target; `asChild` for links |
| Input, Textarea, Select, Label, FieldError, FieldHint | `input.tsx` | `aria-invalid`, errors announced with `role="alert"` |
| Card | `card.tsx` | |
| Alert (info/success/warning/error), Badge, ProgressBar, Skeleton, EmptyState, Spinner | `feedback.tsx` | ProgressBar uses `role="progressbar"` + values |
| Dialog / Drawer, ConfirmDialog | `dialog.tsx` | Radix, focus-trapped, Esc to close; drawers for mobile sidebars |
| Tabs | `tabs.tsx` | Radix |
| Table | `table.tsx` | Horizontally scrollable on mobile, `<caption>` for screen readers |
| Upload control | `studio/workspace.tsx`, `studio/library.tsx` | Requires a rights attestation checkbox |
| AI chat | `player/tutor-panel.tsx` | `aria-live`, citations, feedback buttons |
| Status indicators | `studio/status-badge.tsx` | Draft / Generating / In review / Published / Archived |

## Layout patterns

- **Public pages:** sticky header (collapses below 1024px into an accessible disclosure menu), single-column below 768px.
- **Dashboards:** 256px sidebar ≥1024px; drawer on smaller screens.
- **Course player:** outline (288px) · lesson (max 72ch) · tutor (384px ≥1280px); outline and tutor become drawers on smaller screens.
- **Studio:** outline tree · editor/preview tabs · AI assistant (stacked below 1280px).

## Motion

Only short colour/opacity transitions. Everything is disabled with `prefers-reduced-motion`.
