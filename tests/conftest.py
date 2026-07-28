import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from api.main import app
from core.config import settings


# 1. كائن وهمي يمثل المتعلم للاختبارات
class DummyLearner:
    def __init__(self, learner_id: str = "learner_123"):
        self.id = learner_id


@pytest.fixture
def test_learner():
    """يوفر كائن متعلم وهمي للاختبارات."""
    return DummyLearner()


# 2. عميل HTTP لاختبارات API
@pytest.fixture(scope="function")
async def async_client():
    """يوفر عميل AsyncClient مرتبط بـ FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


# 3. فيكتشر قاعدة البيانات للاختبارات التكاملية (Integration Tests)
@pytest.fixture(scope="function")
async def db_session():
    """يوفر جلسة قاعدة بيانات لا تزامنية لاختبارات Neon DB."""
    # استخدام رابط قاعدة البيانات من الإعدادات البيئية
    db_url = getattr(settings, "DATABASE_URL", None) or getattr(
        settings, "NEON_DATABASE_URL", None
    )

    if not db_url:
        pytest.skip("لم يتم العثور على DATABASE_URL في الإعدادات.")

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    await engine.dispose()