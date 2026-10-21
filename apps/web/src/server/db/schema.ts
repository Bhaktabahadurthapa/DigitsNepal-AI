import {
  type AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const EMBEDDING_DIMENSIONS = 768;

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ─── Enums ──────────────────────────────────────────────────────────────────
export const languageEnum = pgEnum("language", ["en", "ne"]);
export const roleEnum = pgEnum("role", ["learner", "educator", "admin"]);
export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "generating",
  "in_review",
  "published",
  "archived",
]);
export const learningTypeEnum = pgEnum("learning_type", ["course", "assessment", "lesson"]);
export const levelEnum = pgEnum("level", ["beginner", "intermediate", "advanced"]);
export const outlineStatusEnum = pgEnum("outline_status", ["none", "proposed", "approved"]);
export const visibilityEnum = pgEnum("visibility", ["public", "organization", "private"]);
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const jobTypeEnum = pgEnum("job_type", [
  "extract_source",
  "generate_outline",
  "generate_course",
  "revise_lesson",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "rejected",
]);
export const orgMemberRoleEnum = pgEnum("org_member_role", ["owner", "admin", "reviewer", "member"]);
export const educatorStatusEnum = pgEnum("educator_status", ["none", "pending", "approved", "rejected"]);

// ─── Better Auth core tables ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const twoFactors = pgTable(
  "two_factors",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (t) => [index("two_factors_user_idx").on(t.userId), index("two_factors_secret_idx").on(t.secret)],
);

/** Better Auth's database-backed rate limiter (model "rateLimit"); shared across instances. */
export const authRateLimits = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ─── Identity & tenancy ─────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  preferredLanguage: languageEnum("preferred_language").notNull().default("en"),
  bio: text("bio"),
  educatorStatus: educatorStatusEnum("educator_status").notNull().default("none"),
  educatorStatement: text("educator_statement"),
  /** Users under 18 must have a recorded guardian/educator consent before using AI features. */
  isMinor: boolean("is_minor").notNull().default(false),
  guardianConsentAt: timestamp("guardian_consent_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("roles_user_role_uq").on(t.userId, t.role)],
);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  kind: text("kind", { enum: ["school", "nonprofit", "other"] }).notNull().default("nonprofit"),
  status: text("status", { enum: ["pending", "active", "suspended"] }).notNull().default("pending"),
  description: text("description"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("org_members_uq").on(t.organizationId, t.userId),
    index("org_members_user_idx").on(t.userId),
  ],
);

// ─── Courses ────────────────────────────────────────────────────────────────
export type OutlineLesson = { title: string; objectives: string[]; sourceChunkIds?: string[] };
export type OutlineModule = { title: string; summary?: string; lessons: OutlineLesson[] };
export type CourseOutline = { modules: OutlineModule[]; notes?: string };

export type Citation = {
  n: number;
  chunkId: string;
  documentId: string;
  filename: string;
  quote: string;
  page?: number | null;
};

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    language: languageEnum("language").notNull().default("en"),
    level: levelEnum("level").notNull().default("beginner"),
    audience: text("audience").notNull().default(""),
    objectives: jsonb("objectives").$type<string[]>().notNull().default([]),
    learningType: learningTypeEnum("learning_type").notNull().default("course"),
    status: courseStatusEnum("status").notNull().default("draft"),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    /** Seeded/curated sample content may be "coming_soon" until it is fully reviewed. */
    availability: text("availability", { enum: ["available", "coming_soon"] })
      .notNull()
      .default("available"),
    /** Shown to learners on the course page, e.g. the review status of curated starter content. */
    notice: text("notice"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    outline: jsonb("outline").$type<CourseOutline | null>(),
    outlineStatus: outlineStatusEnum("outline_status").notNull().default("none"),
    outlineApprovedAt: timestamp("outline_approved_at", { withTimezone: true }),
    outlineApprovedBy: text("outline_approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    publishedVersionId: uuid("published_version_id").references(
      (): AnyPgColumn => courseVersions.id,
      { onDelete: "set null" },
    ),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("courses_owner_idx").on(t.ownerId),
    index("courses_org_idx").on(t.organizationId),
    index("courses_status_idx").on(t.status),
  ],
);

/** Immutable snapshot of a published course. Learners always read from a version. */
export type CourseSnapshot = {
  title: string;
  summary: string;
  language: "en" | "ne";
  level: string;
  objectives: string[];
  modules: {
    id: string;
    title: string;
    summary: string;
    lessons: {
      id: string;
      title: string;
      objectives: string[];
      contentMd: string;
      citations: Citation[];
      estimatedMinutes: number;
      flashcards: { front: string; back: string }[];
      quiz: {
        id: string;
        title: string;
        passScore: number;
        questions: {
          id: string;
          type: "single_choice" | "true_false";
          prompt: string;
          options: string[];
          correctIndex: number;
          explanation: string;
          citation: Citation | null;
        }[];
      } | null;
    }[];
  }[];
  sourceDocumentIds: string[];
};

export const courseVersions = pgTable(
  "course_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references((): AnyPgColumn => courses.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<CourseSnapshot>().notNull(),
    changelog: text("changelog"),
    publishedBy: text("published_by").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("course_versions_uq").on(t.courseId, t.version)],
);

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("modules_course_idx").on(t.courseId, t.position)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    objectives: jsonb("objectives").$type<string[]>().notNull().default([]),
    contentMd: text("content_md").notNull().default(""),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    flashcards: jsonb("flashcards").$type<{ front: string; back: string }[]>().notNull().default([]),
    estimatedMinutes: integer("estimated_minutes").notNull().default(5),
    origin: text("origin", { enum: ["ai", "human", "seed"] }).notNull().default("human"),
    status: text("status", { enum: ["pending", "ready", "failed"] }).notNull().default("ready"),
    /** Pending AI revision proposal; never applied without educator acceptance. */
    proposedRevision: jsonb("proposed_revision").$type<{
      instruction: string;
      contentMd: string;
      citations: Citation[];
      createdAt: string;
    } | null>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("lessons_module_idx").on(t.moduleId, t.position), index("lessons_course_idx").on(t.courseId)],
);

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    passScore: integer("pass_score").notNull().default(70),
    createdAt: createdAt(),
  },
  (t) => [index("assessments_course_idx").on(t.courseId), index("assessments_lesson_idx").on(t.lessonId)],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type", { enum: ["single_choice", "true_false"] }).notNull().default("single_choice"),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation").notNull().default(""),
    citation: jsonb("citation").$type<Citation | null>(),
  },
  (t) => [index("questions_assessment_idx").on(t.assessmentId, t.position)],
);

// ─── Learning records ───────────────────────────────────────────────────────
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    courseVersionId: uuid("course_version_id")
      .notNull()
      .references(() => courseVersions.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["active", "completed"] }).notNull().default("active"),
    lastLessonId: uuid("last_lesson_id"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("enrollments_uq").on(t.userId, t.courseId), index("enrollments_course_idx").on(t.courseId)],
);

/** Lesson ids refer to ids inside the course_version snapshot (stable across versions). */
export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull(),
    status: text("status", { enum: ["started", "completed"] }).notNull().default("started"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("progress_uq").on(t.enrollmentId, t.lessonId), index("progress_user_idx").on(t.userId)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").notNull(),
    lessonId: uuid("lesson_id").notNull(),
    courseVersionId: uuid("course_version_id")
      .notNull()
      .references(() => courseVersions.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["in_progress", "submitted"] }).notNull().default("in_progress"),
    answers: jsonb("answers").$type<Record<string, number>>().notNull().default({}),
    score: integer("score"),
    passed: boolean("passed"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (t) => [index("quiz_attempts_user_idx").on(t.userId, t.startedAt), index("quiz_attempts_enrollment_idx").on(t.enrollmentId)],
);

// ─── Knowledge library ──────────────────────────────────────────────────────
export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    storageKey: text("storage_key").notNull(),
    status: documentStatusEnum("status").notNull().default("uploaded"),
    error: text("error"),
    pageCount: integer("page_count"),
    charCount: integer("char_count"),
    injectionFlags: integer("injection_flags").notNull().default(0),
    /** Uploader attests they hold the rights to use this material for education. */
    rightsConfirmed: boolean("rights_confirmed").notNull().default(false),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("source_documents_owner_idx").on(t.ownerId), index("source_documents_org_idx").on(t.organizationId)],
);

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    heading: text("heading"),
    content: text("content").notNull(),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    tokenEstimate: integer("token_estimate").notNull().default(0),
    flaggedInjection: boolean("flagged_injection").notNull().default(false),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddingModel: text("embedding_model"),
    createdAt: createdAt(),
  },
  (t) => [
    index("source_chunks_document_idx").on(t.documentId, t.ordinal),
    index("source_chunks_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

export const courseSources = pgTable(
  "course_sources",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.documentId] })],
);

// ─── Jobs ───────────────────────────────────────────────────────────────────
export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: jobTypeEnum("type").notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").references(() => sourceDocuments.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    result: jsonb("result").$type<Record<string, unknown> | null>(),
    progress: integer("progress").notNull().default(0),
    message: text("message"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
    createdAt: createdAt(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("generation_jobs_claim_idx").on(t.status, t.runAfter),
    index("generation_jobs_course_idx").on(t.courseId),
    index("generation_jobs_owner_idx").on(t.ownerId),
  ],
);

// ─── AI conversations ───────────────────────────────────────────────────────
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id"),
    language: languageEnum("language").notNull().default("en"),
    createdAt: createdAt(),
  },
  (t) => [index("ai_conversations_user_idx").on(t.userId, t.createdAt)],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    grounded: boolean("grounded"),
    provider: text("provider"),
    model: text("model"),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    latencyMs: integer("latency_ms"),
    createdAt: createdAt(),
  },
  (t) => [index("ai_messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

// ─── Governance ─────────────────────────────────────────────────────────────
export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    courseVersionId: uuid("course_version_id").references(() => courseVersions.id, { onDelete: "set null" }),
    lessonId: uuid("lesson_id"),
    reviewerId: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    decision: text("decision", {
      enum: [
        "outline_approved",
        "submitted_for_review",
        "publish_approved",
        "changes_requested",
        "revision_accepted",
        "revision_rejected",
        "archived",
      ],
    }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("review_decisions_course_idx").on(t.courseId, t.createdAt)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text("ip_address"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_events_created_idx").on(t.createdAt), index("audit_events_actor_idx").on(t.actorId)],
);

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
    feature: text("feature", { enum: ["tutor", "outline", "lesson", "quiz", "embed", "revise"] }).notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
    latencyMs: integer("latency_ms"),
    jobId: uuid("job_id").references(() => generationJobs.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("usage_records_created_idx").on(t.createdAt),
    index("usage_records_user_idx").on(t.userId, t.createdAt),
    index("usage_records_org_idx").on(t.organizationId, t.createdAt),
  ],
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["tutor", "course", "abuse_report", "general"] }).notNull(),
    messageId: uuid("message_id").references(() => aiMessages.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    rating: integer("rating"),
    comment: text("comment"),
    status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
    createdAt: createdAt(),
  },
  (t) => [index("feedback_kind_idx").on(t.kind, t.status)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

