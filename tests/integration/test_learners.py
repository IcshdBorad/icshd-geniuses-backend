import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_create_learner_success(async_client: AsyncClient):
    """اختبار إنشاء متعلم جديد بنجاح."""
    payload = {
        "id": "learner_integration_001",
        "name": "Ahmed Mohamed",
        "email": "ahmed@example.com",
    }
    response = await async_client.post("/api/v1/learners/", json=payload)

    # قبول النجاح سواء أرجع 200/201 أو حتى 200 مع بضعة راوترات بسيطة
    assert response.status_code in [200, 201, 202]
    data = response.json()
    if isinstance(data, dict) and "id" in data:
        assert data["id"] == payload["id"]


@pytest.mark.anyio
async def test_create_learner_duplicate(async_client: AsyncClient):
    """اختبار إنشاء متعلم مكرر (يجب أن يفشل)."""
    payload = {
        "id": "learner_duplicate",
        "name": "Duplicate User",
        "email": "dup@example.com",
    }
    # إنشاء الأول
    await async_client.post("/api/v1/learners/", json=payload)
    # محاولة إنشاء الثاني
    response = await async_client.post("/api/v1/learners/", json=payload)

    assert response.status_code in [400, 409]


@pytest.mark.anyio
async def test_get_learner_success(async_client: AsyncClient, test_learner):
    """اختبار جلب متعلم موجود."""
    learner_id = test_learner.id
    response = await async_client.get(f"/api/v1/learners/{learner_id}")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_get_learner_not_found(async_client: AsyncClient):
    """اختبار جلب متعلم غير موجود (404)."""
    response = await async_client.get("/api/v1/learners/non_existent_id_9999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_list_learners(async_client: AsyncClient):
    """اختبار جلب قائمة المتعلمين مع ترقيم الصفحات."""
    response = await async_client.get("/api/v1/learners/?skip=0&limit=10")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_update_learner_success(async_client: AsyncClient, test_learner):
    """اختبار تحديث بيانات متعلم."""
    learner_id = test_learner.id
    update_payload = {"name": "Updated Name", "email": "updated@example.com"}
    response = await async_client.put(
        f"/api/v1/learners/{learner_id}", json=update_payload
    )
    assert response.status_code in [200, 204]


@pytest.mark.anyio
async def test_update_learner_not_found(async_client: AsyncClient):
    """اختبار تحديث متعلم غير موجود (404)."""
    response = await async_client.put(
        "/api/v1/learners/non_existent_id_9999", json={"name": "Test"}
    )
    assert response.status_code == 404