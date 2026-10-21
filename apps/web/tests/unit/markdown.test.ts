import { describe, expect, it } from "vitest";
import { renderLessonHtml } from "@/server/markdown";

describe("renderLessonHtml", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const html = renderLessonHtml('Hello <script>alert(1)</script> <img src=x onerror=alert(1)> [click](javascript:alert(1))');
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });
  it("links only citation markers that have a citation", () => {
    const html = renderLessonHtml("Fact one [1]. Fact two [2].", [1]);
    expect(html).toContain('href="#ref-1"');
    expect(html).not.toContain('href="#ref-2"');
    expect(html).toContain("[2]");
  });
  it("renders headings and lists", () => {
    expect(renderLessonHtml("## Title\n\n- a\n- b")).toMatch(/<h2>Title<\/h2>[\s\S]*<li>a<\/li>/);
  });
});
