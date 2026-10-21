import type { AllowedExt } from "./files";
import { looksLikeInjection } from "./safety";

export type Page = { page: number | null; text: string };
export type Chunk = {
  ordinal: number;
  heading: string | null;
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  tokenEstimate: number;
  flaggedInjection: boolean;
};

export async function extractText(ext: AllowedExt, bytes: Uint8Array): Promise<Page[]> {
  if (ext === "pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await pdfText(pdf, { mergePages: false });
    return (text as string[]).map((t, i) => ({ page: i + 1, text: t }));
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return [{ page: null, text: value }];
  }
  return [{ page: null, text: new TextDecoder("utf-8").decode(bytes) }];
}

const HEADING_MD = /^#{1,4}\s+(.+?)\s*#*$/;

function isHeadingLine(line: string): string | null {
  const md = HEADING_MD.exec(line);
  if (md) return md[1].trim();
  const t = line.trim();
  // Short title-like line without terminal punctuation (common in PDFs/DOCX).
  if (t.length >= 3 && t.length <= 80 && !/[.,;:!?।]$/.test(t) && /^[\p{Lu}\p{N}ऀ-ॿ]/u.test(t) && t.split(/\s+/).length <= 10) {
    return t.replace(/^\d+(\.\d+)*\s+/, "");
  }
  return null;
}

export function estimateTokens(text: string) {
  const devanagari = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  return Math.max(1, Math.round(devanagari > text.length * 0.2 ? text.length / 2 : text.length / 4));
}

type Block = { heading: string | null; text: string; page: number | null };

/**
 * Turn raw page text into heading-tagged paragraphs. Works for Markdown/TXT (blank-line paragraphs)
 * and for PDF text where blank lines are lost and lines are hard-wrapped.
 */
export function toBlocks(pages: Page[]): Block[] {
  const blocks: Block[] = [];
  let heading: string | null = null;
  for (const p of pages) {
    const lines = p.text.replace(/\r\n?/g, "\n").split("\n");
    let para: string[] = [];
    const flushPara = () => {
      const text = para.join(" ").replace(/\s+([,.;:!?।])/g, "$1").replace(/\s+/g, " ").trim();
      if (text) blocks.push({ heading, text, page: p.page });
      para = [];
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        flushPara();
        continue;
      }
      const prev = para.length ? para[para.length - 1] : "";
      const startsSection = para.length === 0 || /[.!?।:]["”')]?$/.test(prev);
      const h = isHeadingLine(line);
      if (h && (HEADING_MD.test(line) || (startsSection && i < lines.length - 1))) {
        flushPara();
        heading = h;
        continue;
      }
      para.push(line);
    }
    flushPara();
  }
  return blocks;
}

/**
 * Split documents into ~target-sized chunks along paragraph boundaries, keeping the current
 * heading and page range so citations can point back to the original location.
 */
export function chunkPages(pages: Page[], target = 900, max = 1400): Chunk[] {
  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let bufLen = 0;
  let heading: string | null = null;
  let pageStart: number | null = null;
  let pageEnd: number | null = null;

  const flush = () => {
    const content = buf.join("\n\n").trim();
    if (content.length >= 40) {
      chunks.push({ ordinal: chunks.length, heading, content, pageStart, pageEnd, tokenEstimate: estimateTokens(content), flaggedInjection: looksLikeInjection(content) });
    }
    buf = [];
    bufLen = 0;
    pageStart = null;
  };

  for (const b of toBlocks(pages)) {
    if (b.heading !== heading) {
      if (bufLen > 0) flush();
      heading = b.heading;
    }
    const pieces = b.text.length > max ? (b.text.match(new RegExp(`[\\s\\S]{1,${max}}(?=[.!?।]\\s|$)|[\\s\\S]{1,${max}}`, "g")) ?? [b.text]) : [b.text];
    for (const piece of pieces) {
      if (bufLen + piece.length > max && bufLen > 0) flush();
      if (pageStart === null) pageStart = b.page;
      pageEnd = b.page;
      buf.push(piece.trim());
      bufLen += piece.length;
      if (bufLen >= target) flush();
    }
  }
  if (bufLen > 0) flush();
  return chunks;
}
