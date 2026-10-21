# Feature Matrix: Honen (reference) vs DigitsNepal

Honen status: O = Observed, D = Documented, I = Inferred, U = Unknown.
DigitsNepal status: the **v1 target**. The actual implementation state is tracked in `PROJECT_STATUS.md`.

| Area | Feature | Honen | DigitsNepal v1 | Notes |
|---|---|---|---|---|
| Knowledge | File upload (PDF/Office/text) | D | ✅ PDF, DOCX, MD, TXT | 10 MB limit, magic-byte validation |
| Knowledge | Video/audio/YouTube/GitHub sources | D | ❌ Future | Bandwidth & cost |
| Knowledge | Third-party connectors (Drive, Notion…) | O/D | ❌ Future | |
| Knowledge | Folders & versions | O | ⚠️ Flat library + checksum | |
| Knowledge | Org privacy walls | D | ✅ Data-access-layer scoping + tests | |
| Authoring | Course / Assessment / Atom types | O | ✅ Full course / Assessment / Short lesson | |
| Authoring | Research mode (web search) | O/D | ❌ | Avoid ungrounded content |
| Authoring | Outline approval gate | O/D | ✅ server-enforced | |
| Authoring | Parallel background generation with progress | O/D | ✅ durable job queue in Postgres | |
| Authoring | Chat-based editing | O/D | ⚠️ Controlled AI revision proposals per lesson | Accept/reject, never silent |
| Authoring | Structural editor | D | ✅ Outline tree + lesson editor | |
| Authoring | Versioning & rollback | D | ✅ immutable published versions; rollback later | |
| Authoring | Review/approval queue | D | ✅ In Review state + review_decisions | |
| Authoring | Branding/Rules/Skills | O/D | ❌ Future | |
| Authoring | Images/video/podcasts | O/D | ❌ | Cost |
| Learning | Reading | O | ✅ | |
| Learning | Quiz with explanations | D | ✅ | |
| Learning | Flashcards | D | ⚠️ optional, generated | |
| Learning | Voice tutor | O | ❌ text only | |
| Learning | Tutor grounded in course context | D | ✅ RAG with citations | |
| Learning | Tutor disabled during tests | D | ✅ | |
| Learning | Citations to source passages | O/D | ✅ | |
| Learning | Personalised rewrites | D | ❌ | |
| Learning | Nepali language | U | ✅ UI + content language + tutor language | Core differentiator |
| Learning | Certificates / streaks / badges | D | ❌ Future | |
| Delivery | Assignments to groups | O | ❌ Future (Org workspace) | |
| Delivery | LMS (LTI/SCORM/cmi5) | O/D | ❌ | |
| Delivery | Public catalog | D | ✅ Academy | |
| Measurement | Learner progress | O/D | ✅ | |
| Measurement | Educator course analytics | O | ⚠️ basic counts | |
| Measurement | AI-generated reports | O | ❌ | |
| Measurement | Agent/AI cost visibility | O | ✅ Admin usage & cost | |
| Platform | Admin MFA | U | ✅ TOTP required for /admin | |
| Platform | AI budget hard limits | U | ✅ app-level soft/hard limits | |
