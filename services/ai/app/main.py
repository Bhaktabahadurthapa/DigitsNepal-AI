"""DigitsNepal AI service: stateless, internal-only HTTP API.

It has no database, filesystem or outbound tool access beyond the configured model provider.
Callers (the web app and worker) are responsible for authorization, retrieval scoping and budgets.
"""

import hmac
import logging
import time

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .providers import extractive, llm_tasks
from .providers.llm import ProviderError, get_llm
from .schemas import (
    EmbedRequest,
    EmbedResponse,
    LessonRequest,
    LessonResponse,
    OutlineRequest,
    OutlineResponse,
    ReviseRequest,
    ReviseResponse,
    TutorRequest,
    TutorResponse,
)

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","msg":%(message)s}')
log = logging.getLogger("ai")

app = FastAPI(title="DigitsNepal AI Service", version="0.1.0", docs_url=None, redoc_url=None)


def require_token(authorization: str = Header(default=""), s: Settings = Depends(get_settings)) -> None:
    expected = f"Bearer {s.ai_service_token}"
    if not hmac.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.middleware("http")
async def access_log(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    # Never log request bodies: they contain uploaded document text.
    log.info('"%s %s %s %dms"', request.method, request.url.path, response.status_code,
             int((time.perf_counter() - t0) * 1000))
    return response


@app.exception_handler(ProviderError)
async def provider_error(_: Request, exc: ProviderError):
    log.warning('"provider_error: %s"', str(exc)[:200].replace('"', "'"))
    return JSONResponse(status_code=502, content={"detail": "provider_error", "message": str(exc)[:300]})


@app.get("/health")
def health(s: Settings = Depends(get_settings)):
    return {"status": "ok", "provider": s.ai_provider, "embed_provider": s.ai_embed_provider}


def _gen(s: Settings, override: str = ""):
    """Return the configured LLM, or None for extractive mode.

    Callers may only *downgrade* to extractive (used when the monthly AI budget is exhausted).
    """
    if s.ai_provider == "extractive" or override == "extractive":
        return None
    return get_llm(s.ai_provider, s)


@app.post("/v1/embed", response_model=EmbedResponse, dependencies=[Depends(require_token)])
def embed(req: EmbedRequest, s: Settings = Depends(get_settings)):
    if s.ai_embed_provider == "extractive":
        return extractive.embed(req)
    return llm_tasks.embed(get_llm(s.ai_embed_provider, s), req)


@app.post("/v1/outline", response_model=OutlineResponse, dependencies=[Depends(require_token)])
def outline(req: OutlineRequest, s: Settings = Depends(get_settings), x_dn_provider_override: str = Header(default="")):
    llm = _gen(s, x_dn_provider_override)
    return extractive.outline(req) if llm is None else llm_tasks.outline(llm, req)


@app.post("/v1/lesson", response_model=LessonResponse, dependencies=[Depends(require_token)])
def lesson(req: LessonRequest, s: Settings = Depends(get_settings), x_dn_provider_override: str = Header(default="")):
    llm = _gen(s, x_dn_provider_override)
    return extractive.lesson(req) if llm is None else llm_tasks.lesson(llm, req)


@app.post("/v1/tutor", response_model=TutorResponse, dependencies=[Depends(require_token)])
def tutor(req: TutorRequest, s: Settings = Depends(get_settings), x_dn_provider_override: str = Header(default="")):
    llm = _gen(s, x_dn_provider_override)
    return extractive.tutor(req) if llm is None else llm_tasks.tutor(llm, req)


@app.post("/v1/revise", response_model=ReviseResponse, dependencies=[Depends(require_token)])
def revise(req: ReviseRequest, s: Settings = Depends(get_settings), x_dn_provider_override: str = Header(default="")):
    llm = _gen(s, x_dn_provider_override)
    return extractive.revise(req) if llm is None else llm_tasks.revise(llm, req)
