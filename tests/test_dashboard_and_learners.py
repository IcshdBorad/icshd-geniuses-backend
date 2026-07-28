import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_reset_progress_and_check_dashboard(async_client: AsyncClient, test_learner):
    """اختبار إعادة تعيين التقدم واستعراض الـ Dashboard."""
    learner_id = test_learner.id

    # 1. إرسال طلب إعادة التعيين إلى المسار المعرف بـ FastAPI
    # ملاحظة: إذا كان base_url في conftest يتضمن /api/v1 نستخدم المسار النسبي، 
    # وإلا يتم تجربة المسار الكامل /api/v1/learners/{learner_id}/progress
    reset_resp = await async_client.delete(
        f"/learners/{learner_id}/progress",
        follow_redirects=True
    )

    if reset_resp.status_code == 404:
        reset_resp = await async_client.delete(
            f"/api/v1/learners/{learner_id}/progress",
            follow_redirects=True
        )

    # التحقق من نجاح عملية التصفير (200 OK أو 204 No Content)
    assert reset_resp.status_code in [200, 204], (
        f"فشل التصفير برمز: {reset_resp.status_code}\n"
        f"التفاصيل: {reset_resp.text}"
    )

    # 2. التحقق من استعراض لوحة التحكم (Dashboard) للمتعلم بعد التصفير
    dashboard_resp = await async_client.get(
        f"/dashboard/{learner_id}",
        follow_redirects=True
    )

    if dashboard_resp.status_code == 404:
        dashboard_resp = await async_client.get(
            f"/api/v1/dashboard/{learner_id}",
            follow_redirects=True
        )

    assert dashboard_resp.status_code == 200, (
        f"فشل جلب الـ Dashboard برمز: {dashboard_resp.status_code}\n"
        f"التفاصيل: {dashboard_resp.text}"
    )