import pytest
from unittest.mock import AsyncMock, MagicMock
from core.application.use_cases.adaptive_session import (
    AdaptiveSessionUseCase,
    SubmitAnswerRequest,
    QuestionDTO,
)
from core.services.irt_engine import AdaptiveIRTEngine


@pytest.mark.asyncio
async def test_process_answer_and_get_next_success():
    # Setup Mocks
    irt_engine = AdaptiveIRTEngine()
    question_repo = AsyncMock()
    session_repo = AsyncMock()

    # Mock Data
    question_repo.get_by_id.return_value = QuestionDTO(id="q1", difficulty=0.0, discrimination=1.0)
    session_repo.get_student_theta.return_value = 0.0
    session_repo.get_answered_question_ids.return_value = ["q1"]
    
    q_next = QuestionDTO(id="q2", difficulty=0.2, discrimination=1.0)
    question_repo.get_candidate_questions.return_value = [q_next]

    use_case = AdaptiveSessionUseCase(
        irt_engine=irt_engine,
        question_repo=question_repo,
        session_repo=session_repo,
    )

    request = SubmitAnswerRequest(
        student_id="student_1",
        session_id="session_101",
        question_id="q1",
        is_correct=True,
    )

    response = await use_case.process_answer_and_get_next(request)

    # Assertions
    assert response.student_id == "student_1"
    assert response.previous_theta == 0.0
    assert response.new_theta > 0.0  # لأن الإجابة صحيحة
    assert response.next_question is not None
    assert response.next_question.id == "q2"

    # Verify Repositories Interaction
    session_repo.record_response.assert_called_once_with("session_101", "q1", True)
    session_repo.update_student_theta.assert_called_once()