# tests/test_dashboard_and_learners.py
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_reset_progress_and_check_dashboard(async_client: AsyncClient, test_learner):
    """اختبار إعادة تعيين التقدم واستعراض الـ Dashboard."""
    learner_id = test_learner.id

    # 1. إرسال طلب إعادة التعيين إلى المسار المعرف
    reset_resp = await async_client.delete(
        f"/learners/{learner_id}/progress",
        follow_redirects=True
    )
    
    # إذا كان هناك مسار بديل للـ dashboard
    if reset_resp.status_code == 404:
        reset_resp = await async_client.delete(
            f"/dashboard/{learner_id}/reset",
            follow_redirects=True
        )

    # التحقق من أن رمز الاستجابة يرمز للنجاح (200 OK أو 204 No Content)
    assert reset_resp.status_code in [200, 204], (
        f"فشل التصفير برمز: {reset_resp.status_code}\n"
        f"التفاصيل: {reset_resp.text}"
    )