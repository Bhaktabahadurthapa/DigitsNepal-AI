from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_token: str = "dev-ai-token"
    ai_provider: Literal["extractive", "gemini", "openai"] = "extractive"
    ai_embed_provider: Literal["extractive", "gemini", "openai"] = "extractive"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_embed_model: str = "gemini-embedding-001"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embed_model: str = "text-embedding-3-small"

    price_input_per_mtok: float = 0.10
    price_output_per_mtok: float = 0.40
    price_embed_per_mtok: float = 0.15
    max_output_tokens: int = 2048
    request_timeout_s: float = 60.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
