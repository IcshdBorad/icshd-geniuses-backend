import os
from pathlib import Path
import pytest
from dotenv import load_dotenv
import redis
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# تحميل ملف .env من الجذر
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)


@pytest.mark.asyncio
async def test_neon_postgres_connection():
    """اختبار الاتصال بقاعدة بيانات Neon السحابية/المحلية بشكل Async"""
    db_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    assert db_url is not None, "DATABASE_URL غير موجود في ملف .env"

    # إنشاء Async Engine
    engine = create_async_engine(db_url)
    
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        assert result.scalar() == 1

    await engine.dispose()


def test_upstash_redis_connection():
    """اختبار الاتصال بـ Upstash Redis السحابي/المحلي"""
    redis_url = os.getenv("UPSTASH_REDIS_URL") or os.getenv("REDIS_URL")
    assert redis_url is not None, "UPSTASH_REDIS_URL غير موجود في ملف .env"

    r = redis.from_url(redis_url)
    r.set("icshd_test_key", "active", ex=10)
    val = r.get("icshd_test_key")

    if isinstance(val, bytes):
        val = val.decode("utf-8")

    assert val == "active"