import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_learner_dashboard_success(async_client: AsyncClient, test_learner):
    """اختبار استرجاع بيانات لوحة التحكم الخاصة بالمتعلم."""
    response = await async_client.get(f"/api/v1/dashboard/{test_learner.id}")
    assert response.status_code == 200

    data = response.json()
    assert data["learner_id"] == test_learner.id
    assert "current_ability" in data
    assert "ability_history" in data
    assert isinstance(data["topic_mastery"], list)


@pytest.mark.anyio
async def test_get_dashboard_stats_success(async_client: AsyncClient):
    """اختبار استرجاع الإحصائيات العامة للوحة التحكم."""
    response = await async_client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    assert "total_active_learners" in data["data"]