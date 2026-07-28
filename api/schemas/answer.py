from __future__ import annotations

from api.schemas.common import APIModel


class SubmitAnswerRequest(APIModel):
    """
    Submit learner answer payload.
    """

    learner_id: str
    session_id: str
    submitted_answer: str
    question_id: str | None = None
    response_time_ms: float = 5000.0


class SubmitAnswerResponse(APIModel):
    """
    Result returned after answer evaluation and adaptive update.
    """

    is_correct: bool
    correct_answer: str | None = None
    new_difficulty: float | str | None = None
    accuracy_rate: float | None = None
    
    # حقول إضافية اختيارية لضمان عدم حدوث ValidationError
    # في حال قامت الـ UseCase بإرجاع توصيات أو تفاصيل الجلسة
    score: float | None = None
    next_question_id: str | None = None
    session_completed: bool = False
    recommendations: list[str] = []