import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

/**
 * Render untrusted lesson Markdown (AI- or educator-authored) to sanitized HTML.
 * Citation markers like [2] become links to the reference list when a matching citation exists.
 */
export function renderLessonHtml(md: string, citationNumbers: number[] = [], idPrefix = "ref"): string {
  const valid = new Set(citationNumbers);
  const withCites = md.replace(/\[(\d{1,2})\](?!\()/g, (m, n) =>
    valid.has(Number(n)) ? `<sup><a class="cite" href="#${idPrefix}-${n}" aria-label="Reference ${n}">[${n}]</a></sup>` : m,
  );
  const html = marked.parse(withCites, { async: false, gfm: true, breaks: false }) as string;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "code", "pre", "blockquote", "a", "sup", "br", "hr", "table", "thead", "tbody", "tr", "th", "td"],
    ALLOWED_ATTR: ["href", "class", "aria-label"],
    ALLOWED_URI_REGEXP: /^(?:https?:|#)/i,
  });
}
