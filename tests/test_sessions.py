import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_create_session_success(async_client: AsyncClient, test_learner):
    """اختبار إنشاء الجلسة بنجاح."""
    payload = {
        "learner_id": test_learner.id,
        "subject": "Mathematics",
        "topic": "Algebra Basics",
    }

    response = await async_client.post("/api/v1/sessions", json=payload)

    assert response.status_code in [
        200,
        201,
    ], f"Expected 200/201 but got {response.status_code}: {response.text}"