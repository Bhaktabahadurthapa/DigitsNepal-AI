# DigitsNepal Visual QA (REA, local app)

The local app was inspected with REA `capture_browser_scenario` (Chromium 156, headless) on 2026-10-21 and
compared against **DigitsNepal's own design specification** (`docs/design-system.md`), not against Honen.
Screenshots: `research/rea/digitsnepal/` (contact sheets `sheet-*.png`).

| Evidence ID (prefix) | Viewport | Flow | Result |
|---|---|---|---|
| `ev_46e8945fb6eb` | 1440×900 | Homepage scroll | Layout per spec; one copy error found ("Reviewed starter courses") and fixed |
| `ev_6b7feacc80bb` | 1440×900 | Educator sign-in → Studio editor (Edit/Preview) → player | 3-pane Studio and player render; citations link to references |
| `ev_1ae62b3840b4` | 390×844 | Mobile menu → Academy → Nepali course → sign-in → player → tutor drawer | Menu, drawers and Devanagari rendering work; no horizontal scroll |
| `ev_b94db9e50617` | 768×1024 | Homepage, Academy | Header collapses to the menu button below 1024px as specified |

## Findings

| # | Finding | Severity | Action |
|---|---|---|---|
| 1 | Homepage claimed "Reviewed starter courses" although content is not independently reviewed | High (honesty) | Copy changed in EN/NE |
| 2 | Hero CTA white on `#0D9488` = 3.7:1 (axe, E2E) | AA failure | Uses `teal-700` (5.4:1) |
| 3 | Studio stepper/tabs: `#64748B` on `slate-100` ≈ 4.3:1 (axe, E2E) | AA failure | `slate-600` text |
| 4 | Toasts with rich colours failed contrast (axe, E2E) | AA failure | Default toast style |
| 5 | Extractive outline objectives were generic ("Explain: written / testing / team") | Quality | Tiny metadata chunks merged; objectives built from section headings + repeated terms |
| 6 | Next dev overlay showed "1 Issue": a hydration warning about `caret-color: transparent` | Not a product bug | Injected by the headless capture harness to hide the text caret; not present in normal browsing |
| 7 | PDF text from the test fixture shows split words ("pane ls") | Fixture artifact | Produced by macOS `cupsfilter` text layout; real PDFs vary. Documented as an extraction limitation |

## Not yet covered

- Manual screen-reader pass (VoiceOver/NVDA/TalkBack).
- Low-end Android device performance on slow 3G.
- Native-speaker review of Nepali UI copy.
