# Database

PostgreSQL 16 with **pgvector**. The schema is defined in `apps/web/src/server/db/schema.ts`, and migrations live in `apps/web/drizzle/`.

## Migration procedure

```bash
cd apps/web
pnpm db:generate --name=<change>   # after editing schema.ts; review the generated SQL
pnpm db:migrate                    # applies pending migrations (idempotent, journaled)
```

Rules:
- **Never** run `drizzle-kit push` or a drop/reset against staging or production.
- Destructive changes (drop column/table) use expand → migrate data → contract across separate releases.
- Take a backup (see `deployment.md`) before running migrations in production.

## Tables

| Group | Tables |
|---|---|
| Identity (Better Auth) | `users`, `sessions`, `accounts`, `verifications`, `two_factors`, `auth_rate_limits` |
| People & tenancy | `profiles`, `roles`, `organizations`, `organization_members` |
| Courses | `courses`, `course_versions` (immutable snapshots), `modules`, `lessons`, `assessments`, `questions`, `course_sources` |
| Learning records | `enrollments`, `progress`, `quiz_attempts` |
| Knowledge | `source_documents`, `source_chunks` (vector(768) + HNSW cosine index) |
| AI | `generation_jobs` (durable queue), `ai_conversations`, `ai_messages`, `usage_records`, `rate_limits`, `system_settings` |
| Governance | `review_decisions`, `audit_events`, `feedback` |

## Deletion policies (highlights)

- Deleting a user cascades to their profile, roles, sessions, enrollments, progress, attempts and conversations; `usage_records` and `audit_events` keep the row with `actor/user = NULL`, preserving cost and audit history.
- Course owner is `ON DELETE RESTRICT`, so a user with courses cannot be deleted by accident.
- `course_sources.document_id` is `RESTRICT`: a source used by a course cannot be hard-deleted.
- Source documents are soft-deleted (`deleted_at`), their chunks and stored file are removed, and `retention_until` supports scheduled cleanup.
- `enrollments.course_version_id` and `quiz_attempts.course_version_id` are `RESTRICT`: published versions are never removed while learner records refer to them.

## Tenant isolation

Enforced in the **data-access layer** (`src/server/services/access.ts`). Every course, document and
organization read goes through `canEditCourse`, `canViewPublishedCourse`, `catalogFilter`,
`canAccessDocument`, `documentFitsCourse` and `requireOrgRole`. Vector search (`retrieval.ts`) takes an explicit
document allow-list computed from the viewer's permissions. Covered by `tests/integration/isolation.test.ts`.
