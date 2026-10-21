# Honen Workflows (Observed / Documented / Inferred / Unknown)

The authenticated product was **not** accessed. The workflows below come from marketing demos
captured with REA and from public documentation. Each step carries a classification.

## 1. Course creation

| # | Step | Classification | Evidence | DigitsNepal adaptation |
|---|---|---|---|---|
| 1 | Start a new course from a composer ("What do you want to learn?") with a type selector: Course / Assessment / Atom, plus Research toggle and attach (+) | **Observed** (demo mock in hero) | `ev_3487643ad234` step `s0` | Wizard step 1: Full course / Assessment / Short lesson |
| 2 | Add sources: topic text, uploaded files (PDF, Office, text, images, video ≤1 GB), YouTube, GitHub, Knowledge Base, connectors | **Documented** (`docs-text/course-creation.md`) | — | v1: PDF, DOCX, MD, TXT up to 10 MB each; topic text optional |
| 3 | Sources are fully processed before the agent proposes anything; per-file status; creation disabled until processing finishes | **Documented** | — | Same rule: outline generation is disabled server-side until every source is `ready` |
| 4 | Agent asks only for missing info (audience, level, structure, length) | **Documented** | — | We collect these up front in wizard step 2 (deterministic form, cheaper than chat) |
| 5 | Agent proposes a full outline (units, topics, goals, activity types, projects, assessments) | **Documented**; outline UI partly **Observed** ("Approve the plan first." section with unit/topic rows and Read/Flashcards/Quiz chips) | `ev_3487643ad234` step `p4` | Structured JSON outline (modules → lessons → objectives) validated with Zod/Pydantic |
| 6 | Review and revise outline in plain language; **nothing is built until approved** | **Documented** + **Observed** heading "Approve the plan first." | a11y `course-creation-desktop-p5-a11y.txt` | Editable outline form + server-enforced approval gate (`outline_approved_at`) |
| 7 | On approval, structure is created and activities generate in parallel; author can leave | **Documented**; "Watch it build" progress UI **Observed** ("Building your lessons… 16 of 18 activities ready") | step `p5` | Durable `generation_jobs` with progress %, retries, cancel |
| 8 | Editor: Preview (real learner runtime), Advanced Edit (tree), Comments, Materials, Settings; persistent chat sidebar | **Documented** | — | Studio 3-pane: outline tree · lesson editor/preview · AI assistant |
| 9 | Edit by chatting; highlight a passage to target a change | **Observed** copy ("Edit it by talking.") / **Documented** | a11y | AI revision returns a *proposal* shown as before/after; the educator accepts or rejects it |
| 10 | Output validated (schema-checked), confirms before destructive actions | **Documented** | — | All AI output schema-validated; invalid output → job fails with a recoverable error |
| 11 | Working draft → revision on apply; version history with rollback; drafts private until publish | **Documented** | — | `course_versions` snapshot at each publish; published versions immutable |
| 12 | Publish to catalogs; optional review queue (compare changes, comment, approve/send back) | **Documented** (`publishing-and-review.md`) | — | Draft → In Review → Published; educator (owner) or admin approves; `review_decisions` table |
| — | Latency, failure messages, cost per course | **Unknown** | — | We measure our own |

## 2. Knowledge management

| Step | Classification | Evidence | Adaptation |
|---|---|---|---|
| Upload documents, recordings, videos; sync connectors (Drive, OneDrive, SharePoint, Notion, Confluence…) | **Observed** copy / **Documented** | `ev_10f97bde985a` | v1: uploads only. Connectors are future work |
| Folders, document versions, compare changes | **Observed** copy | a11y | v1: flat per-owner/per-org library with checksum; versioning later |
| Scheduled agents detect changed sources and propose course updates for review | **Observed** copy (tab "Agents & Automations") | a11y | Not in v1 |
| Workspace privacy walls keep knowledge inside the organization | **Documented** (FAQ) | a11y | Org-scoped data access, enforced in the data-access layer and covered by tests |
| Same KB grounds courses, sites, agents, MCP | **Documented** | — | Same `source_chunks` ground Studio generation and the Tutor |

## 3. Learning experience

| Element | Classification | Evidence | Adaptation |
|---|---|---|---|
| Player chrome: back-to-dashboard, lesson-plan button with topic progress bar, Back/Next, format selector ("Read — Learn") | **Observed** (embedded demo) | `ev_99c0008842d2` a11y; `ev_62884f385b75` | Left module/lesson sidebar, Previous/Next, progress bar |
| Reading view with title, read time, word count | **Observed** | learner `s0` screenshot | Lesson header with estimated minutes |
| Tutor controls: Start tutor, mute mic/audio, captions, settings, open chat | **Observed** (buttons in a11y) | `learner-experience-desktop-p4-a11y.txt` | Text chat only in v1 (no voice; bandwidth/cost) |
| Formats: read, lecture, video, podcast, flashcards, comic, jam, arcade, quiz | **Documented** | `learner-experience.md` | v1: reading, quiz, optional flashcards |
| Tutor uses course context; Socratic; authors set guardrails | **Documented** | — | RAG over the course's sources; system prompt with scope guardrails |
| Tutor tools withdrawn during tests | **Documented** | — | Tutor disabled while a quiz attempt is in progress |
| Completion on real signals (95% scroll, 80% cards, quiz submit) | **Documented** | — | v1: "Mark complete" unlocks at end of lesson; quiz completes on submit |
| Citations with six visibility levels | **Documented** | — | Numbered references showing the source file name and passage |
| Certificates, streaks, badges | **Documented** | — | Future |

## 4. Assignments & analytics (public demos)

| Element | Classification | Adaptation |
|---|---|---|
| Assign course/unit/topic/test to individuals, groups or workspace; mastery thresholds | **Observed** copy (`ev_8e8d6bbe3540`) | Future (org workspaces) |
| Completion %, test scores, project performance per group | **Observed** copy | Educator analytics v1: enrollments, completions, average quiz score per course |
| Ask-in-plain-language AI reports, auto-refreshing pages | **Observed** copy (`ev_ff45cf647b56`) | Not in v1 (cost) |
| Grading uses the version the learner took | **Observed** copy | `quiz_attempts.course_version_id` recorded |
| Agent run visibility (conversations, tools, model, cost) | **Observed** copy | Admin AI usage & cost page from `usage_records` |
