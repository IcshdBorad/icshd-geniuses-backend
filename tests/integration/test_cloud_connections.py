import os
from pathlib import Path
import pytest

from dotenv import load_dotenv
import redis
from sqlalchemy import create_engine, text

# تحميل ملف .env من الجذر
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)


def test_neon_postgres_connection():
    """اختبار الاتصال بقاعدة بيانات Neon السحابية"""
    db_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    assert db_url is not None, "DATABASE_URL غير موجود في ملف .env"

    engine = create_engine(db_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar() == 1


def test_upstash_redis_connection():
    """اختبار الاتصال بـ Upstash Redis السحابي"""
    # قراءة المتغير بالاسم الموجود في .env
    redis_url = os.getenv("UPSTASH_REDIS_URL") or os.getenv("REDIS_URL")
    assert redis_url is not None, "UPSTASH_REDIS_URL غير موجود في ملف .env"

    # الاتصال بالـ Redis
    r = redis.from_url(redis_url)
    r.set("icshd_test_key", "active", ex=10)
    val = r.get("icshd_test_key")

    if isinstance(val, bytes):
        val = val.decode("utf-8")

    assert val == "active"