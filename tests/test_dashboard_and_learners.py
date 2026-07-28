import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_reset_progress_and_check_dashboard(
    async_client: AsyncClient, test_learner
):
    """اختبار إعادة تعيين التقدم واستعراض الـ Dashboard."""
    learner_id = test_learner.id

    # 1. إرسال طلب إعادة التعيين
    reset_resp = await async_client.delete(
        f"/api/v1/learners/{learner_id}/progress", follow_redirects=True
    )

    # التحقق من نجاح عملية التصفير (200 OK أو 204 No Content)
    assert reset_resp.status_code in [
        200,
        204,
    ], f"فشل التصفير برمز: {reset_resp.status_code}\nالتفاصيل: {reset_resp.text}"

    # 2. التحقق من استعراض لوحة التحكم (Dashboard) للمتعلم
    dashboard_resp = await async_client.get(
        f"/api/v1/dashboard/{learner_id}", follow_redirects=True
    )

    assert (
        dashboard_resp.status_code == 200
    ), f"فشل جلب الـ Dashboard برمز: {dashboard_resp.status_code}\nالتفاصيل: {dashboard_resp.text}"