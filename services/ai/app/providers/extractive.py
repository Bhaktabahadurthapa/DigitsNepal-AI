"""Offline, deterministic, LLM-free provider.

It never invents facts: every sentence it outputs is copied from a supplied source, so all
citations are valid by construction. Quality is limited (no paraphrasing, translation or
reasoning). It exists for free reproducible tests and as a fallback when the AI budget is
exhausted. The UI labels its output as "extractive mode".
"""

import time

from ..safety import looks_like_injection
from ..schemas import (
    CitationOut,
    EmbedRequest,
    EmbedResponse,
    Flashcard,
    LessonRequest,
    LessonResponse,
    Outline,
    OutlineLesson,
    OutlineModule,
    OutlineRequest,
    OutlineResponse,
    QuizQuestion,
    ReviseRequest,
    ReviseResponse,
    Source,
    TutorRequest,
    TutorResponse,
    Usage,
)
from ..text import (
    EMBED_DIMENSIONS,
    estimate_tokens,
    hash_embed,
    key_terms,
    overlap_score,
    sentences,
    stable_int,
    tokens,
)

PROVIDER = "extractive"
MODEL = "extractive-v1"

T = {
    "en": {
        "overview": "Overview",
        "key_points": "Key points",
        "summary": "Summary",
        "not_found": (
            "I could not find this in the course materials, so I won't guess. "
            "Try rephrasing your question, or ask your educator."
        ),
        "intro": "Here is what the course materials say:",
        "objective": "Explain",
        "flash_q": "What does the material say about “{term}”?",
        "quiz_q": "Fill in the blank: {sentence}",
        "explain": "From the source: “{sentence}”",
        "module": "Part {n}",
    },
    "ne": {
        "overview": "परिचय",
        "key_points": "मुख्य बुँदाहरू",
        "summary": "सारांश",
        "not_found": (
            "मैले यो कुरा पाठ्य सामग्रीमा भेटिनँ, त्यसैले अनुमान गर्दिनँ। "
            "प्रश्न अर्को तरिकाले सोध्नुहोस् वा आफ्नो शिक्षकलाई सोध्नुहोस्।"
        ),
        "intro": "पाठ्य सामग्री अनुसार:",
        "objective": "व्याख्या गर्नुहोस्",
        "flash_q": "“{term}” बारे सामग्रीले के भन्छ?",
        "quiz_q": "खाली ठाउँ भर्नुहोस्: {sentence}",
        "explain": "स्रोतबाट: “{sentence}”",
        "module": "भाग {n}",
    },
}


def _usage(started: float, text_in: str, text_out: str) -> Usage:
    return Usage(
        provider=PROVIDER,
        model=MODEL,
        tokens_in=estimate_tokens(text_in),
        tokens_out=estimate_tokens(text_out),
        cost_usd=0.0,
        latency_ms=int((time.perf_counter() - started) * 1000),
    )


def _safe_sentences(src: Source) -> list[str]:
    return [s for s in sentences(src.content) if not looks_like_injection(s) and len(s) <= 500]


def embed(req: EmbedRequest) -> EmbedResponse:
    t0 = time.perf_counter()
    vectors = [hash_embed(t) for t in req.texts]
    return EmbedResponse(
        vectors=vectors, dimensions=EMBED_DIMENSIONS, usage=_usage(t0, " ".join(req.texts), "")
    )


def _title_from(src: Source) -> str:
    if src.heading and 3 <= len(src.heading) <= 120:
        return src.heading.strip().rstrip(":")
    first = (_safe_sentences(src) or [src.content])[0]
    words = first.split()
    return " ".join(words[:8]).rstrip(".,:;") + ("…" if len(words) > 8 else "")


def outline(req: OutlineRequest) -> OutlineResponse:
    t0 = time.perf_counter()
    tr = T[req.language]
    srcs = [s for s in req.sources if _safe_sentences(s)] or req.sources

    # Group consecutive chunks that share a heading into one lesson candidate.
    groups: list[tuple[str, list[Source]]] = []
    for s in srcs:
        title = _title_from(s)
        if groups and s.heading and groups[-1][1][-1].heading == s.heading:
            groups[-1][1].append(s)
        else:
            groups.append((title, [s]))

    total_lessons = min(len(groups), req.target_modules * req.lessons_per_module)
    total_lessons = max(1, total_lessons)
    # Merge groups evenly into the requested number of lessons.
    per = len(groups) / total_lessons
    lesson_groups = [
        groups[int(i * per) : max(int((i + 1) * per), int(i * per) + 1)] for i in range(total_lessons)
    ]
    lessons: list[OutlineLesson] = []
    for lg in lesson_groups:
        members = [s for _, ss in lg for s in ss]
        terms = key_terms([m.content for m in members], k=3)
        objectives = [f"{tr['objective']}: {t}" for t in terms] or [lg[0][0]]
        lessons.append(
            OutlineLesson(title=lg[0][0][:200], objectives=objectives, source_ids=[m.id for m in members][:12])
        )

    n_modules = max(1, min(req.target_modules, len(lessons)))
    per_mod = -(-len(lessons) // n_modules)
    modules = []
    for i in range(n_modules):
        chunk = lessons[i * per_mod : (i + 1) * per_mod]
        if not chunk:
            continue
        modules.append(OutlineModule(title=f"{tr['module'].format(n=i + 1)}: {chunk[0].title}"[:200],
                                     summary="", lessons=chunk))
    result = Outline(
        modules=modules,
        notes="Generated offline from the structure of your sources (extractive mode). Review and rename titles.",
    )
    return OutlineResponse(outline=result, usage=_usage(t0, " ".join(s.content for s in srcs), str(result)))


def _rank(sources: list[Source], query: str) -> list[tuple[float, str, Source]]:
    q = set(tokens(query))
    ranked = []
    for src in sources:
        for sent in _safe_sentences(src):
            ranked.append((overlap_score(q, sent), sent, src))
    ranked.sort(key=lambda r: r[0], reverse=True)
    return ranked


def lesson(req: LessonRequest) -> LessonResponse:
    t0 = time.perf_counter()
    tr = T[req.language]
    query = " ".join([req.lesson_title, *req.objectives])
    ranked = _rank(req.sources, query)
    # Keep document order among the selected sentences for readability.
    order = {id(s): i for i, s in enumerate(req.sources)}
    chosen = ranked[:8] if ranked else []
    chosen.sort(key=lambda r: (order[id(r[2])], r[2].content.find(r[1])))

    citations: list[CitationOut] = []
    cite_for: dict[str, int] = {}
    paragraphs: list[str] = []
    for _, sent, src in chosen:
        if src.id not in cite_for:
            cite_for[src.id] = len(cite_for) + 1
            citations.append(CitationOut(n=cite_for[src.id], source_id=src.id, quote=sent[:600]))
        paragraphs.append(f"{sent} [{cite_for[src.id]}]")

    body = [f"## {tr['overview']}", ""]
    body += [" ".join(paragraphs[i : i + 2]) + "\n" for i in range(0, len(paragraphs), 2)]
    terms = key_terms([s for _, s, _ in chosen], k=5)
    if terms:
        body += [f"## {tr['key_points']}", ""] + [f"- **{t}**" for t in terms] + [""]
    if paragraphs:
        body += [f"## {tr['summary']}", "", paragraphs[0]]
    content = "\n".join(body).strip()

    flashcards = []
    for term in terms[:4]:
        sent = next((s for _, s, _ in chosen if term in s.lower()), None)
        if sent:
            flashcards.append(Flashcard(front=tr["flash_q"].format(term=term)[:200], back=sent[:600]))

    quiz = _cloze_questions(req, chosen, terms, tr)
    return LessonResponse(
        content_md=content,
        citations=citations,
        flashcards=flashcards,
        quiz=quiz,
        usage=_usage(t0, query + " ".join(s.content for s in req.sources), content),
    )


def _cloze_questions(req: LessonRequest, chosen, terms: list[str], tr) -> list[QuizQuestion]:
    all_terms = list(dict.fromkeys(terms + key_terms([s.content for s in req.sources], k=12)))
    questions: list[QuizQuestion] = []
    used: set[str] = set()
    for _, sent, src in chosen:
        if len(questions) >= req.question_count:
            break
        low = sent.lower()
        term = next((t for t in all_terms if t not in used and len(t) > 3 and f" {t}" in f" {low}"), None)
        if not term:
            continue
        distractors = [t for t in all_terms if t != term and t not in low][:3]
        if len(distractors) < 2:
            continue
        start = low.find(term)
        blanked = sent[:start] + "_____" + sent[start + len(term) :]
        options = distractors[:3]
        pos = stable_int(req.lesson_title, sent) % (len(options) + 1)
        options.insert(pos, term)
        used.add(term)
        questions.append(
            QuizQuestion(
                prompt=tr["quiz_q"].format(sentence=blanked)[:500],
                options=options,
                correct_index=pos,
                explanation=tr["explain"].format(sentence=sent)[:800],
                source_id=src.id,
            )
        )
    return questions


GROUNDING_THRESHOLD = 0.12


def tutor(req: TutorRequest) -> TutorResponse:
    t0 = time.perf_counter()
    tr = T[req.language]
    ranked = _rank(req.sources, req.question)
    top = [r for r in ranked if r[0] >= GROUNDING_THRESHOLD][:3]
    if not top:
        answer = tr["not_found"]
        return TutorResponse(answer=answer, citations=[], grounded=False,
                             usage=_usage(t0, req.question, answer))
    citations: list[CitationOut] = []
    cite_for: dict[str, int] = {}
    lines = [tr["intro"], ""]
    for _, sent, src in top:
        if src.id not in cite_for:
            cite_for[src.id] = len(cite_for) + 1
            citations.append(CitationOut(n=cite_for[src.id], source_id=src.id, quote=sent[:600]))
        lines.append(f"- {sent} [{cite_for[src.id]}]")
    answer = "\n".join(lines)
    return TutorResponse(answer=answer, citations=citations, grounded=True,
                         usage=_usage(t0, req.question + " ".join(s.content for s in req.sources), answer))


def revise(req: ReviseRequest) -> ReviseResponse:
    t0 = time.perf_counter()
    if req.operation == "custom":
        return ReviseResponse(
            content_md=req.content_md, citations=[], applied=False,
            note="Free-form instructions need an LLM provider. Extractive mode supports Simplify, Shorten and Key points.",
            usage=_usage(t0, req.instruction, ""),
        )
    blocks = req.content_md.split("\n\n")
    out: list[str] = []
    for b in blocks:
        if b.startswith(("#", "- ")):
            out.append(b)
            continue
        sents = sentences(b) or [b]
        keep = 1 if req.operation in ("shorten", "simplify") else len(sents)
        if req.operation == "simplify":
            sents = sorted(sents[: max(2, keep)], key=len)[:keep]
        out.append(" ".join(sents[:keep]))
    content = "\n\n".join(out)
    if req.operation == "key_points":
        terms = key_terms([req.content_md], k=5)
        content += f"\n\n## {T[req.language]['key_points']}\n\n" + "\n".join(f"- **{t}**" for t in terms)
    return ReviseResponse(content_md=content, citations=[], applied=True,
                          note="Applied deterministically (extractive mode).", usage=_usage(t0, req.content_md, content))
