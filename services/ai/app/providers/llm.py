"""Gemini and OpenAI adapters using their public REST APIs (structured JSON output + embeddings)."""

import json
import time
from typing import Any, Protocol

import httpx

from ..config import Settings
from ..schemas import Usage
from ..text import EMBED_DIMENSIONS


class ProviderError(RuntimeError):
    pass


class LLM(Protocol):
    name: str
    model: str

    def generate_json(self, system: str, user: str, schema: dict[str, Any]) -> tuple[dict[str, Any], Usage]: ...

    def embed(self, texts: list[str], task: str) -> tuple[list[list[float]], Usage]: ...


def _cost(s: Settings, tin: int, tout: int, embed: bool = False) -> float:
    if embed:
        return round(tin / 1e6 * s.price_embed_per_mtok, 6)
    return round(tin / 1e6 * s.price_input_per_mtok + tout / 1e6 * s.price_output_per_mtok, 6)


def _strip_unsupported(schema: Any) -> Any:
    """Gemini's responseSchema accepts an OpenAPI subset; drop keys it rejects."""
    if isinstance(schema, dict):
        return {
            k: _strip_unsupported(v)
            for k, v in schema.items()
            if k not in ("additionalProperties", "title", "$schema", "default")
        }
    if isinstance(schema, list):
        return [_strip_unsupported(v) for v in schema]
    return schema


class Gemini:
    name = "gemini"
    base = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, s: Settings):
        if not s.gemini_api_key:
            raise ProviderError("GEMINI_API_KEY is not configured")
        self.s = s
        self.model = s.gemini_model
        self.client = httpx.Client(timeout=s.request_timeout_s, headers={"x-goog-api-key": s.gemini_api_key})

    def generate_json(self, system, user, schema):
        t0 = time.perf_counter()
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": _strip_unsupported(schema),
                "maxOutputTokens": self.s.max_output_tokens,
                "temperature": 0.3,
            },
        }
        r = self.client.post(f"{self.base}/models/{self.model}:generateContent", json=body)
        if r.status_code >= 400:
            raise ProviderError(f"Gemini HTTP {r.status_code}: {r.text[:300]}")
        data = r.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"Gemini returned no content: {str(data)[:300]}") from e
        meta = data.get("usageMetadata", {})
        tin, tout = meta.get("promptTokenCount", 0), meta.get("candidatesTokenCount", 0)
        usage = Usage(provider=self.name, model=self.model, tokens_in=tin, tokens_out=tout,
                      cost_usd=_cost(self.s, tin, tout), latency_ms=int((time.perf_counter() - t0) * 1000))
        return json.loads(text), usage

    def embed(self, texts, task):
        t0 = time.perf_counter()
        model = self.s.gemini_embed_model
        task_type = "RETRIEVAL_QUERY" if task == "query" else "RETRIEVAL_DOCUMENT"
        reqs = [
            {"model": f"models/{model}", "content": {"parts": [{"text": t}]}, "taskType": task_type,
             "outputDimensionality": EMBED_DIMENSIONS}
            for t in texts
        ]
        r = self.client.post(f"{self.base}/models/{model}:batchEmbedContents", json={"requests": reqs})
        if r.status_code >= 400:
            raise ProviderError(f"Gemini embed HTTP {r.status_code}: {r.text[:300]}")
        vectors = [_l2(e["values"]) for e in r.json()["embeddings"]]
        tin = sum(len(t) // 4 for t in texts)
        return vectors, Usage(provider=self.name, model=model, tokens_in=tin, cost_usd=_cost(self.s, tin, 0, True),
                              latency_ms=int((time.perf_counter() - t0) * 1000))


class OpenAI:
    name = "openai"
    base = "https://api.openai.com/v1"

    def __init__(self, s: Settings):
        if not s.openai_api_key:
            raise ProviderError("OPENAI_API_KEY is not configured")
        self.s = s
        self.model = s.openai_model
        self.client = httpx.Client(timeout=s.request_timeout_s,
                                   headers={"Authorization": f"Bearer {s.openai_api_key}"})

    def generate_json(self, system, user, schema):
        t0 = time.perf_counter()
        body = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {"type": "json_schema", "json_schema": {"name": "result", "schema": schema}},
            "max_tokens": self.s.max_output_tokens,
            "temperature": 0.3,
        }
        r = self.client.post(f"{self.base}/chat/completions", json=body)
        if r.status_code >= 400:
            raise ProviderError(f"OpenAI HTTP {r.status_code}: {r.text[:300]}")
        data = r.json()
        text = data["choices"][0]["message"]["content"]
        u = data.get("usage", {})
        tin, tout = u.get("prompt_tokens", 0), u.get("completion_tokens", 0)
        usage = Usage(provider=self.name, model=self.model, tokens_in=tin, tokens_out=tout,
                      cost_usd=_cost(self.s, tin, tout), latency_ms=int((time.perf_counter() - t0) * 1000))
        return json.loads(text), usage

    def embed(self, texts, task):
        t0 = time.perf_counter()
        model = self.s.openai_embed_model
        r = self.client.post(f"{self.base}/embeddings",
                             json={"model": model, "input": texts, "dimensions": EMBED_DIMENSIONS})
        if r.status_code >= 400:
            raise ProviderError(f"OpenAI embed HTTP {r.status_code}: {r.text[:300]}")
        data = r.json()
        vectors = [d["embedding"] for d in sorted(data["data"], key=lambda d: d["index"])]
        tin = data.get("usage", {}).get("prompt_tokens", 0)
        return vectors, Usage(provider=self.name, model=model, tokens_in=tin, cost_usd=_cost(self.s, tin, 0, True),
                              latency_ms=int((time.perf_counter() - t0) * 1000))


def _l2(v: list[float]) -> list[float]:
    n = sum(x * x for x in v) ** 0.5 or 1.0
    return [x / n for x in v]


def get_llm(name: str, s: Settings) -> LLM:
    if name == "gemini":
        return Gemini(s)
    if name == "openai":
        return OpenAI(s)
    raise ProviderError(f"Unknown LLM provider {name}")
