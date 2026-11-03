"""Validated environment configuration; secrets never included in response models."""

import os
from pathlib import Path
from functools import lru_cache
from typing import Literal
from pydantic import BaseModel, Field, model_validator

try:
    from pydantic_settings import BaseSettings as SettingsBase
except ModuleNotFoundError:
    # Offline development checks can still validate configuration with Pydantic.
    # Production refuses this fallback below; the deployment lock includes the package.
    SettingsBase = BaseModel


class Settings(SettingsBase):
    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://sherzod:sherzod@127.0.0.1:5432/sherzod"
    public_app_url: str = "http://localhost:3000"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    allowed_hosts: str = "localhost,127.0.0.1,testserver,backend"
    trusted_proxy_ips: str = ""
    session_secret: str = Field(default="local-development-only-change-this-secret", min_length=32)
    csrf_secret: str = Field(default="local-csrf-only-change-this-secret-12345", min_length=32)
    session_hours: int = Field(default=168, ge=1, le=720)
    timezone: str = "Asia/Tashkent"
    media_root: Path = Path(".local/media")
    storage_backend: Literal["disk", "s3"] = "disk"
    s3_bucket: str = ""
    s3_endpoint_url: str = ""
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    login_limit: int = Field(default=10, ge=1)
    lead_limit: int = Field(default=6, ge=1)
    absence_threshold: int = Field(default=2, ge=1, le=30)
    billing_due_day: int = Field(default=10, ge=1, le=28)

    @model_validator(mode="after")
    def production_safety(self):
        if not self.database_url.startswith("postgresql"):
            raise ValueError("PostgreSQL is required")
        if self.timezone != "Asia/Tashkent":
            raise ValueError("MVP reporting timezone is Asia/Tashkent")
        if self.app_env == "production":
            if SettingsBase is BaseModel:
                raise ValueError("Install the locked pydantic-settings dependency for production")
            if (
                any(
                    any(
                        marker in secret.lower() for marker in ("local-", "replace-", "change-this")
                    )
                    for secret in (self.session_secret, self.csrf_secret)
                )
                or self.session_secret == self.csrf_secret
            ):
                raise ValueError("Unique production secrets required")
            if not self.public_app_url.startswith("https://") or "*" in self.allowed_origins:
                raise ValueError("HTTPS and exact origins required")
        return self

    @property
    def origins(self):
        return [s.strip().rstrip("/") for s in self.allowed_origins.split(",") if s.strip()]


@lru_cache
def get_settings() -> Settings:
    # Pydantic validates all environment values. No implicit reading of unrelated .env files.
    return Settings.model_validate(
        {k: os.environ[k.upper()] for k in Settings.model_fields if k.upper() in os.environ}
    )
