import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkUpload, safeFilename } from "@/server/services/files";

const pdf = new Uint8Array(readFileSync("tests/fixtures/solar-energy-basics.pdf"));
const enc = (s: string) => new TextEncoder().encode(s);

describe("checkUpload", () => {
  it("accepts a real PDF", () => expect(checkUpload("a.pdf", pdf)).toMatchObject({ ok: true, ext: "pdf" }));
  it("accepts UTF-8 text including Nepali", () => expect(checkUpload("notes.md", enc("# शीर्षक\n\nनमस्ते"))).toMatchObject({ ok: true, ext: "md" }));
  it("rejects a renamed executable/HTML pretending to be PDF", () => expect(checkUpload("evil.pdf", enc("<html><script>alert(1)</script>"))).toEqual({ ok: false, reason: "content_mismatch" }));
  it("rejects unsupported extensions", () => expect(checkUpload("run.exe", pdf)).toEqual({ ok: false, reason: "unsupported_type" }));
  it("rejects binary data in .txt", () => expect(checkUpload("x.txt", new Uint8Array([0, 1, 2, 3]))).toEqual({ ok: false, reason: "content_mismatch" }));
  it("rejects empty and oversize files", () => {
    expect(checkUpload("a.txt", new Uint8Array())).toEqual({ ok: false, reason: "empty_file" });
    expect(checkUpload("a.txt", new Uint8Array(11 * 1024 * 1024).fill(65))).toEqual({ ok: false, reason: "file_too_large" });
  });
  it("rejects path traversal in names", () => expect(checkUpload("../../etc/passwd.txt", enc("x"))).toEqual({ ok: false, reason: "bad_filename" }));
  it("rejects a ZIP that is not a Word document", () => expect(checkUpload("a.docx", new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]))).toEqual({ ok: false, reason: "content_mismatch" }));
  it("sanitizes filenames", () => expect(safeFilename('a<b>"c".pdf')).toBe("a_b_c_.pdf"));
});
