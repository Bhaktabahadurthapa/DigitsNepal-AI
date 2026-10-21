"""Request/response contracts. Every model output is validated against these before leaving the service."""

from typing import Literal

from pydantic import BaseModel, Field

Language = Literal["en", "ne"]


class Source(BaseModel):
    """An untrusted passage of approved course material."""

    id: str = Field(min_length=1, max_length=64)
    filename: str = Field(default="", max_length=300)
    heading: str | None = Field(default=None, max_length=300)
    content: str = Field(min_length=1, max_length=8000)
    page: int | None = None


class Usage(BaseModel):
    provider: str
    model: str
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    latency_ms: int = 0


# ─── Embeddings ─────────────────────────────────────────────────────────────
class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=128)
    task: Literal["document", "query"] = "document"


class EmbedResponse(BaseModel):
    vectors: list[list[float]]
    dimensions: int
    usage: Usage


# ─── Outline ────────────────────────────────────────────────────────────────
class OutlineLesson(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    objectives: list[str] = Field(default_factory=list, max_length=6)
    source_ids: list[str] = Field(default_factory=list, max_length=12)


class OutlineModule(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(default="", max_length=600)
    lessons: list[OutlineLesson] = Field(min_length=1, max_length=8)


class Outline(BaseModel):
    modules: list[OutlineModule] = Field(min_length=1, max_length=10)
    notes: str = Field(default="", max_length=1000)


class OutlineRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    audience: str = Field(default="", max_length=300)
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    language: Language = "en"
    learning_type: Literal["course", "assessment", "lesson"] = "course"
    objectives: list[str] = Field(default_factory=list, max_length=10)
    target_modules: int = Field(default=3, ge=1, le=8)
    lessons_per_module: int = Field(default=2, ge=1, le=6)
    sources: list[Source] = Field(min_length=1, max_length=60)


class OutlineResponse(BaseModel):
    outline: Outline
    usage: Usage


# ─── Lesson + quiz ──────────────────────────────────────────────────────────
class CitationOut(BaseModel):
    n: int = Field(ge=1)
    source_id: str
    quote: str = Field(max_length=600)


class QuizQuestion(BaseModel):
    prompt: str = Field(min_length=3, max_length=500)
    options: list[str] = Field(min_length=2, max_length=5)
    correct_index: int = Field(ge=0)
    explanation: str = Field(default="", max_length=800)
    source_id: str | None = None


class Flashcard(BaseModel):
    front: str = Field(min_length=1, max_length=200)
    back: str = Field(min_length=1, max_length=600)


class LessonRequest(BaseModel):
    course_title: str = Field(max_length=200)
    lesson_title: str = Field(min_length=1, max_length=200)
    objectives: list[str] = Field(default_factory=list, max_length=6)
    language: Language = "en"
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    sources: list[Source] = Field(min_length=1, max_length=12)
    question_count: int = Field(default=3, ge=0, le=8)


class LessonResponse(BaseModel):
    content_md: str
    citations: list[CitationOut]
    flashcards: list[Flashcard]
    quiz: list[QuizQuestion]
    usage: Usage


# ─── Tutor ──────────────────────────────────────────────────────────────────
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class TutorRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1500)
    language: Language = "en"
    course_title: str = Field(default="", max_length=200)
    lesson_title: str = Field(default="", max_length=200)
    history: list[ChatTurn] = Field(default_factory=list, max_length=8)
    sources: list[Source] = Field(default_factory=list, max_length=8)


class TutorResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    grounded: bool
    usage: Usage


# ─── Revision ───────────────────────────────────────────────────────────────
class ReviseRequest(BaseModel):
    instruction: str = Field(min_length=1, max_length=600)
    operation: Literal["simplify", "shorten", "key_points", "custom"] = "custom"
    content_md: str = Field(min_length=1, max_length=20000)
    language: Language = "en"
    sources: list[Source] = Field(default_factory=list, max_length=12)


class ReviseResponse(BaseModel):
    content_md: str
    citations: list[CitationOut]
    applied: bool
    note: str = ""
    usage: Usage
