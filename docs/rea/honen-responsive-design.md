# Honen Responsive Design Observations

All observations are **Observed** from REA screenshots unless noted. Contact sheets: `research/rea/honen/sheets/`.

| Aspect | Desktop 1440×900 | Tablet 768×1024 | Mobile 390×844 | Evidence |
|---|---|---|---|---|
| Header | Floating rounded "pill" container, inset from edges; centre nav with 3 dropdown triggers; right: language combobox, Log in, solid primary CTA | Pill header keeps logo + CTA + hamburger; centre nav hidden | Same as tablet; CTA shrinks to small size | `ev_99c0008842d2`, `ev_e6e346af2a8a`, `ev_54d606fc273b` |
| Mobile menu | — | Hamburger ("Open menu") | Opens an in-header panel: accordion rows Features/Solutions/Company with chevrons, language select, full-width outline "Log in", full-width solid CTA; hamburger becomes ✕ | `ev_49df162e8fa7` step `menu_settle` |
| Sticky header | Header remains pinned while scrolling (seen in every scrolled step) | Same | Same | scroll steps |
| Hero | Centred H1 (~64px, 2 lines), muted 18px subtitle, single CTA | H1 wraps to 2 lines, full-width feel | H1 wraps to 4 lines (~36px), centred | sheets |
| Feature hero | Two columns (text left, product mock right) | **Unknown** (not captured) | **Unknown** | `ev_3487643ad234` |
| Cards strip | 5 equal columns with icon, title, arrow, description; dark band below with two link cards | **Unknown** | **Unknown** | home `p6` |
| Cookie banner | Floating rounded card at bottom centre | Full-width card | Stacked card with two buttons | all |
| Docs | Three-zone layout: left nav tree, centre content (cards grid), floating assistant button | — | — | `ev_a4a40fdd467d` |

## Design tokens inferred from screenshots (Inferred; not measured from CSS)

- Warm off-white page background, white surfaces, very dark green primary buttons, soft large radii (~12–16px), thin borders, subtle shadows
- Sans-serif UI type with a serif display face in the video hero
- Generous whitespace: ~120px+ between sections on desktop
- Rich product mocks instead of photography

## What DigitsNepal takes from this (principles, not pixels)

1. **Sticky, compact header** with a clear primary CTA visible at every width.
2. **Mobile menu as a full-width disclosure** with large (≥44px) touch targets and the CTA repeated at the bottom.
3. **Product mocks that show the real workflow**: our homepage Studio demo animates *our own* wizard steps and is labelled as a demonstration.
4. **One primary action per section**.
5. **Single-column collapse** under 768px; the course player collapses its sidebars into drawers.

DigitsNepal uses its own palette (deep navy `#0D2338`, teal `#0D9488`, light `#F8FAFC`), Inter +
Noto Sans Devanagari, original iconography (lucide, ISC licence) and its own layouts.
