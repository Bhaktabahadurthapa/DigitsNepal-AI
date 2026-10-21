"""Language-agnostic text utilities that work for English and Nepali (Devanagari)."""

import hashlib
import itertools
import math
import re

_TOKEN_SPLIT = re.compile(r"[\s.,;:!?()\[\]{}\"'“”‘’।॥\-–—/\\|*#>`_~+=<]+")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?।॥])\s+|\n{2,}")
_DEVANAGARI = re.compile(r"[ऀ-ॿ]")

STOPWORDS = frozenset(
    """a an the and or but if of to in on for with by from at as is are was were be been being this that these
    those it its into than then so such can could should would will may might must do does did not no yes you your
    we our they their he she his her them us i me my what which who whom how why when where there here also very
    more most less many much some any each every all both few other about over under between through during
    छ हो र मा को का की ले लाई बाट पनि भने यो त्यो यस उक्त गर्न गर्ने हुन्छ थियो छन् हुने एक""".split()
)

EMBED_DIMENSIONS = 768


def tokens(text: str) -> list[str]:
    return [t for t in _TOKEN_SPLIT.split(text.lower()) if t and t not in STOPWORDS and len(t) > 1]


_NE_SUFFIXES = sorted(
    ["हरूलाई", "हरूको", "हरूमा", "हरू", "लाई", "बाट", "देखि", "सम्म", "नुहोस्", "न्छ", "छन्", "को", "का", "की", "मा", "ले", "ने", "छ", "दै"],
    key=len,
    reverse=True,
)
_EN_SUFFIXES = ("ing", "ed", "es", "s")


def stem(token: str) -> str:
    """Very light stemming used for answer matching (not for embeddings)."""
    if _DEVANAGARI.search(token):
        for suf in _NE_SUFFIXES:
            if token.endswith(suf) and len(token) - len(suf) >= 2:
                token = token[: -len(suf)]
                break
        return token[:4]
    for suf in _EN_SUFFIXES:
        if token.endswith(suf) and len(token) - len(suf) >= 4:
            return token[: -len(suf)]
    return token


def match_tokens(text: str) -> set[str]:
    return {stem(t) for t in tokens(text)}


def sentences(text: str) -> list[str]:
    parts = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s and s.strip()]
    return [re.sub(r"\s+", " ", p) for p in parts if len(p) >= 12]


def is_nepali(text: str) -> bool:
    return len(_DEVANAGARI.findall(text)) > max(3, len(text) * 0.2)


def estimate_tokens(text: str) -> int:
    # Devanagari tokenizes much less efficiently than English in most LLM tokenizers.
    return max(1, len(text) // (2 if is_nepali(text) else 4))


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def hash_embed(text: str, dims: int = EMBED_DIMENSIONS) -> list[float]:
    """Deterministic feature-hashing embedding (unigrams + bigrams). Lexical, not semantic."""
    vec = [0.0] * dims
    toks = tokens(text)
    feats = toks + [f"{a}_{b}" for a, b in itertools.pairwise(toks)]
    counts: dict[str, int] = {}
    for f in feats:
        counts[f] = counts.get(f, 0) + 1
    for f, c in counts.items():
        h = hashlib.blake2b(f.encode(), digest_size=8).digest()
        idx = int.from_bytes(h[:4], "little") % dims
        sign = 1.0 if h[4] & 1 else -1.0
        vec[idx] += sign * (1.0 + math.log(c))
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def overlap_score(query_tokens: set[str], text: str) -> float:
    t = match_tokens(text)
    if not t or not query_tokens:
        return 0.0
    inter = len(query_tokens & t)
    return inter / math.sqrt(len(query_tokens) * len(t))


def key_terms(texts: list[str], k: int = 8) -> list[str]:
    """Most distinctive multi-occurrence terms across texts (simple tf * log idf)."""
    df: dict[str, int] = {}
    tf: dict[str, int] = {}
    for t in texts:
        toks = tokens(t)
        for w in toks:
            tf[w] = tf.get(w, 0) + 1
        for w in set(toks):
            df[w] = df.get(w, 0) + 1
    n = max(1, len(texts))
    scored = sorted(
        ((tf[w] * math.log(1 + n / df[w]) * (1 if len(w) > 3 else 0.3), w) for w in tf if not w.isdigit()),
        reverse=True,
    )
    return [w for _, w in scored[:k]]


def stable_int(*parts: str) -> int:
    return int.from_bytes(hashlib.sha256("|".join(parts).encode()).digest()[:4], "little")
