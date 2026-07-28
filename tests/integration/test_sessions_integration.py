import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_full_session_lifecycle_and_irt_integration(async_client: AsyncClient, test_learner):
    """
    اختبار دورة حياة الجلسة كاملة:
    1. بدء جلسة جديدة.
    2. تقديم إجابة صحيحة والتحقق من زيادة القدرة (Theta).
    3. تقديم إجابة خاطئة والتحقق من انخفاض القدرة.
    """
    # 1. بدء الجلسة
    start_payload = {
        "learner_id": test_learner.id,
        "subject": "Mathematics",
        "topic": "Algebra",
        "initial_ability": 0.0
    }
    
    start_res = await async_client.post("/api/v1/sessions", json=start_payload)
    assert start_res.status_code in [200, 201]
    start_data = start_res.json()
    
    session_id = start_data["session_id"]
    current_ability = start_data["current_ability"]
    
    assert session_id is not None
    assert current_ability == 0.0

    # 2. إرسال إجابة صحيحة
    correct_answer_payload = {
        "session_id": session_id,
        "learner_id": test_learner.id,
        "question_id": start_data.get("next_question_id", "q_001"),
        "is_correct": True,
        "response_time_seconds": 12.5
    }
    
    answer_res_1 = await async_client.post("/api/v1/sessions/answer", json=correct_answer_payload)
    assert answer_res_1.status_code == 200
    data_1 = answer_res_1.json()
    
    # التأكد من زيادة القدرة أو حدوث التغير المتوقع
    assert data_1["updated_ability"] > current_ability
    assert data_1["ability_change"] > 0
    
    ability_after_correct = data_1["updated_ability"]

    # 3. إرسال إجابة خاطئة
    incorrect_answer_payload = {
        "session_id": session_id,
        "learner_id": test_learner.id,
        "question_id": data_1.get("next_question_id", "q_002"),
        "is_correct": False,
        "response_time_seconds": 20.0
    }
    
    answer_res_2 = await async_client.post("/api/v1/sessions/answer", json=incorrect_answer_payload)
    assert answer_res_2.status_code == 200
    data_2 = answer_res_2.json()
    
    # التأكد من انخفاض القدرة مقارنة بالخطوة السابقة
    assert data_2["updated_ability"] < ability_after_correct
    assert data_2["ability_change"] < 0


@pytest.mark.anyio
async def test_submit_answer_invalid_payload(async_client: AsyncClient):
    """اختبار التعامل مع البيانات الناقصة أو غير الصالحة عند إرسال الإجابة."""
    bad_payload = {
        "session_id": "sess_invalid",
        # learner_id و question_id مفقودان
        "is_correct": True
    }
    
    response = await async_client.post("/api/v1/sessions/answer", json=bad_payload)
    assert response.status_code == 422  # Validation Error