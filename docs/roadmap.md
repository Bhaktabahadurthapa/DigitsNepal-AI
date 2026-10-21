# Known Limitations & Next-Phase Roadmap

## Known limitations (v0.1)

1. **No deployment.** Nothing runs on digitsnepal.com; CI has never run (no git remote).
2. **LLM providers untested live.** Gemini/OpenAI adapters are implemented but were never called (no keys). The extractive provider is the only tested AI path; it quotes sources and cannot paraphrase, translate or reason.
3. **Starter content is not independently reviewed.** The four Academy courses were drafted with AI assistance and carry a visible notice. Nepali UI strings and the Nepali course need native-speaker review.
4. **Text-based documents only.** No OCR for scanned PDFs; no PPTX, audio or video sources.
5. **Completion signal** is "reached the end of the lesson + clicked", not a scroll-percentage or time measure.
6. **Email** for password reset requires SMTP configuration; untested end to end.
7. **Malware scanning** is off unless a ClamAV daemon is configured.
8. **Observability:** structured logs, health endpoint and AI cost dashboards only; no error tracker or tracing yet.
9. **CSP** allows `'unsafe-inline'` scripts (Next.js bootstrap). Nonce-based CSP is planned.
10. **Organization workspace** is a foundation: membership by existing account email (no invitation emails), no org-level quotas, no report workflow.
11. **Legal pages** (privacy, terms) are drafts without legal review. DigitsNepal is not a registered charity.
12. **Agent Lab** is an information page; only the tutor exists as a working agent example.
13. **Rollback of course versions** (re-publish an old version) is not in the UI yet; versions are stored immutably.
14. **Accessibility:** automated axe checks pass on tested pages; no manual screen-reader audit yet.

## Roadmap

### Next (pilot readiness)
- Deploy staging (see `deployment.md`), connect the GitHub remote, and get CI green.
- Choose an LLM provider, run the eval suite with it, and tune prompts; human-rate 50 Nepali answers.
- Native-speaker review of Nepali UI and content; educator review of starter courses (then remove notices).
- Sentry + OpenTelemetry; uptime alerts; queue-depth alerting.
- SMTP and password-reset E2E test; invitation emails for organizations.

### Later
- Agent Lab: publish the tutor as a documented open-source tutorial; NGO Report Agent (records → draft → human approval → export) built with Google ADK where multi-step orchestration helps.
- Organization quotas and per-org budgets; consent workflow run by school admins.
- OCR (Tesseract) for scanned PDFs; DOCX/PPTX images.
- Learning paths, certificates (verifiable), spaced-repetition flashcards.
- Volunteer contribution flow and verified impact reporting.
- Course version rollback and side-by-side diff in the review queue.
- Offline-friendly lesson pages for low-connectivity areas (PWA).
