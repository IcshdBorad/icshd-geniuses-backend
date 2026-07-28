import pytest
from httpx import AsyncClient
from api.main import app
from core.infrastructure.models import LearnerModel


@pytest.mark.anyio
async def test_create_session_success(
    async_client: AsyncClient, test_learner: LearnerModel
):
    """اختبار إنشاء الجلسة بنجاح."""
    payload = {"learner_id": test_learner.id}

    response = await async_client.post(
        "/sessions/", json=payload, follow_redirects=True
    )
    if response.status_code == 404:
        response = await async_client.post(
            "/sessions", json=payload, follow_redirects=True
        )

    assert response.status_code in [200, 201], (
        f"فشل الطلب برمز الاستجابة: {response.status_code}\n"
        f"التفاصيل: {response.text}"
    )

    data = response.json()
    assert (
        "session_id" in data
        or "id" in data
        or "session" in data
        or data.get("status") in ["success", True]
    ), f"استجابة غير متوقعة: {data}"