import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_neon_postgres_connection(db_session: AsyncSession):
    """
    اختبار الاتصال بـ Neon PostgreSQL والتحقق من الاستجابة عبر دالة جلسة الاختبار اللا تزامنية.
    """
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1