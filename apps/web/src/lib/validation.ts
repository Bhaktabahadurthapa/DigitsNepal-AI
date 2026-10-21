import { z } from "zod";

export const languageSchema = z.enum(["en", "ne"]);
export const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const createCourseSchema = z.object({
  learningType: z.enum(["course", "assessment", "lesson"]),
  title: z.string().trim().min(3).max(140),
  audience: z.string().trim().max(300).default(""),
  language: languageSchema,
  level: levelSchema,
  objectives: z.array(z.string().trim().min(2).max(200)).max(8).default([]),
  organizationId: z.uuid().nullable().optional(),
  visibility: z.enum(["public", "organization", "private"]).default("public"),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const outlineSchema = z.object({
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        summary: z.string().trim().max(600).optional().default(""),
        lessons: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(200),
              objectives: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
              sourceChunkIds: z.array(z.uuid()).max(12).optional().default([]),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(8)
    .refine((mods) => mods.reduce((n, m) => n + m.lessons.length, 0) <= 24, "At most 24 lessons per course"),
  notes: z.string().max(1000).optional(),
});
export type OutlineInput = z.infer<typeof outlineSchema>;

export const lessonUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  objectives: z.array(z.string().trim().min(1).max(200)).max(6),
  contentMd: z.string().max(40_000),
  estimatedMinutes: z.number().int().min(1).max(120),
});

export const questionUpdateSchema = z
  .object({
    prompt: z.string().trim().min(3).max(500),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(5),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(800),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: "Correct answer must be one of the options", path: ["correctIndex"] });

export const revisionRequestSchema = z.object({
  operation: z.enum(["simplify", "shorten", "key_points", "custom"]),
  instruction: z.string().trim().min(1).max(600),
});

export const tutorAskSchema = z.object({
  courseId: z.uuid(),
  lessonId: z.uuid().optional(),
  conversationId: z.uuid().optional(),
  question: z.string().trim().min(1).max(1500),
  language: languageSchema,
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(10)),
});
