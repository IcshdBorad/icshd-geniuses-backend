import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # --- Upstash Redis ---
    upstash_redis_url: str = ""
    upstash_redis_token: Optional[str] = None

    # --- Neon PostgreSQL ---
    neon_database_url: str = ""

    # --- إعدادات الأداء ---
    cache_ttl_seconds: int = 3600
    batch_size: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def validate_settings():
    if not settings.upstash_redis_url:
        raise ValueError("❌ UPSTASH_REDIS_URL غير موجود في ملف .env")
    if not settings.neon_database_url:
        raise ValueError("❌ NEON_DATABASE_URL غير موجود في ملف .env")
    print("✅ تم تحميل إعدادات Upstash و Neon بنجاح")