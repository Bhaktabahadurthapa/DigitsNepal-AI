/** Upload validation: extension allow-list, size limit and magic-byte sniffing (never trust Content-Type). */

export const ALLOWED = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown",
  txt: "text/plain",
} as const;
export type AllowedExt = keyof typeof ALLOWED;

export const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024);

export type FileCheck = { ok: true; ext: AllowedExt; mime: string } | { ok: false; reason: string };

function startsWith(buf: Uint8Array, sig: number[]) {
  return sig.every((b, i) => buf[i] === b);
}

/** Avoid cutting a multi-byte UTF-8 character when sampling. */
function trimToBoundary(buf: Uint8Array, n: number) {
  let end = Math.min(n, buf.length);
  if (end < buf.length) while (end > 0 && (buf[end] & 0xc0) === 0x80) end--;
  return end;
}

function looksLikeUtf8Text(buf: Uint8Array): boolean {
  const sample = buf.subarray(0, trimToBoundary(buf, 8192));
  if (sample.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return true;
  } catch {
    return false;
  }
}

export function checkUpload(filename: string, bytes: Uint8Array): FileCheck {
  if (bytes.length === 0) return { ok: false, reason: "empty_file" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "file_too_large" };
  if (/[\\/\0]/.test(filename) || filename.length > 200) return { ok: false, reason: "bad_filename" };
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (!(ext in ALLOWED)) return { ok: false, reason: "unsupported_type" };
  const e = ext as AllowedExt;
  if (e === "pdf" && !startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ok: false, reason: "content_mismatch" };
  if (e === "docx") {
    if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return { ok: false, reason: "content_mismatch" };
    const head = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 64 * 1024)));
    if (!head.includes("word/") && !head.includes("[Content_Types].xml")) return { ok: false, reason: "content_mismatch" };
  }
  if ((e === "md" || e === "txt") && !looksLikeUtf8Text(bytes)) return { ok: false, reason: "content_mismatch" };
  return { ok: true, ext: e, mime: ALLOWED[e] };
}

export function safeFilename(name: string) {
  return name.replace(/[^\p{L}\p{N}._ -]+/gu, "_").slice(0, 150) || "document";
}
