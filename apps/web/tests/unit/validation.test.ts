import { describe, expect, it } from "vitest";
import { outlineSchema, questionUpdateSchema } from "@/lib/validation";

describe("validation", () => {
  it("caps outlines at 24 lessons", () => {
    const mod = { title: "M", lessons: Array.from({ length: 8 }, (_, i) => ({ title: `L${i}`, objectives: [] })) };
    expect(outlineSchema.safeParse({ modules: [mod, mod, mod] }).success).toBe(true);
    expect(outlineSchema.safeParse({ modules: [mod, mod, mod, { title: "x", lessons: [{ title: "y", objectives: [] }] }] }).success).toBe(false);
  });
  it("requires the correct answer to be one of the options", () => {
    expect(questionUpdateSchema.safeParse({ prompt: "Q?", options: ["a", "b"], correctIndex: 2, explanation: "" }).success).toBe(false);
  });
});
