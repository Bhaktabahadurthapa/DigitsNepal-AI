"""Prompt-injection screening for untrusted source text and source-citation validation."""

import re

from .schemas import CitationOut, Source
from .text import normalize

INJECTION_PATTERNS = [
    r"ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)",
    r"disregard (all |any )?(the )?(previous|prior|above|system) (instructions|prompts?)",
    r"(reveal|print|show|output) (the |your )?(system|hidden|developer) prompt",
    r"you are now (?!learning)",
    r"\bact as (an? )?(admin|administrator|developer|dan|jailbroken)",
    r"(system|developer)\s*(prompt|message|instruction)s?\s*:",
    r"new instructions?\s*:",
    r"\bjailbreak\b",
    r"(api[_ ]?key|password|secret token|credentials?)\s*(is|=|:)",
    r"(send|post|upload|exfiltrate) .{0,40}(to|at) https?://",
    r"<\s*/?\s*(system|instructions?)\s*>",
    r"पहिलेका (सबै )?निर्देशन(हरू)? (बेवास्ता|नमान)",
]
_INJECTION_RE = re.compile("|".join(f"(?:{p})" for p in INJECTION_PATTERNS), re.IGNORECASE)


def looks_like_injection(text: str) -> bool:
    return bool(_INJECTION_RE.search(text))


def wrap_sources(sources: list[Source]) -> str:
    """Render sources as clearly delimited, inert data blocks for an LLM prompt."""
    blocks = []
    for s in sources:
        flag = ' flagged="possible-instructions"' if looks_like_injection(s.content) else ""
        body = s.content.replace("</source>", "</ source>")
        page = f' page="{s.page}"' if s.page else ""
        blocks.append(f'<source id="{s.id}" file="{s.filename}"{page}{flag}>\n{body}\n</source>')
    return "\n".join(blocks)


def validate_citations(
    content: str, citations: list[CitationOut], sources: list[Source]
) -> tuple[str, list[CitationOut]]:
    """Keep only citations that reference a provided source and whose quote is really in it.

    Markers like [3] that do not map to a valid citation are removed from the text, so the
    learner never sees a reference we cannot back up.
    """
    by_id = {s.id: s for s in sources}
    valid: list[CitationOut] = []
    seen: set[int] = set()
    for c in citations:
        src = by_id.get(c.source_id)
        if src is None or c.n in seen:
            continue
        quote = c.quote.strip()
        if quote and normalize(quote) not in normalize(src.content):
            # Model paraphrased: fall back to the opening of the source so the reference stays truthful.
            quote = src.content.strip()[:240]
        valid.append(CitationOut(n=c.n, source_id=c.source_id, quote=quote or src.content.strip()[:240]))
        seen.add(c.n)
    valid_ns = {c.n for c in valid}

    def _strip(m: re.Match[str]) -> str:
        return m.group(0) if int(m.group(1)) in valid_ns else ""

    cleaned = re.sub(r"\[(\d{1,2})\]", _strip, content)
    return cleaned, sorted(valid, key=lambda c: c.n)
