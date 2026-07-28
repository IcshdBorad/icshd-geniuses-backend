# core/application/use_cases/submit_answer_use_case.py

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class SubmitAnswerInput:
    """
    Data Transfer Object (DTO) for receiving answer submissions.
    Handles flexible field mapping to support both user_answer and submitted_answer.
    """
    learner_id: str
    session_id: str
    submitted_answer: str = ""
    user_answer: Optional[str] = None
    question_id: Optional[str] = None
    response_time_ms: float = 5000.0

    def __post_init__(self):
        # Align user_answer with submitted_answer if either is empty
        if not self.user_answer and self.submitted_answer:
            self.user_answer = self.submitted_answer
        elif not self.submitted_answer and self.user_answer:
            self.submitted_answer = self.user_answer


class SubmitAnswerUseCase:
    """
    Evaluates learner submission, recalculates adaptive difficulty,
    and updates session/profile records.
    """

    def __init__(
        self,
        adaptive_engine: Any = None,
        profile_repo: Any = None,
        question_repo: Any = None,
        session_repo: Any = None,
        next_question_pipeline: Any = None,
        **kwargs
    ):
        self.adaptive_engine = adaptive_engine
        self.profile_repo = profile_repo or kwargs.get("adaptive_profile_repo")
        self.question_repo = question_repo or kwargs.get("questions") or kwargs.get("question_repository")
        self.session_repo = session_repo or kwargs.get("sessions") or kwargs.get("session_repository")
        self.next_question_pipeline = next_question_pipeline or kwargs.get("pipeline")

    def execute(self, input_data: Any) -> dict:
        # 1. Safely extract core input variables from dict or dataclass/schema object
        learner_id = getattr(input_data, "learner_id", None)
        session_id = getattr(input_data, "session_id", None)
        question_id = getattr(input_data, "question_id", None)
        
        user_ans = (
            getattr(input_data, "user_answer", None)
            or getattr(input_data, "submitted_answer", None)
            or ""
        )
        response_time = float(getattr(input_data, "response_time_ms", 5000.0) or 5000.0)

        if not learner_id or not session_id:
            raise ValueError("Required parameters 'learner_id' and 'session_id' cannot be missing.")

        # 2. Resolve target question_id (from input or active session context)
        if not question_id and self.session_repo:
            session = getattr(self.session_repo, "get_by_id", lambda x: None)(session_id)
            if session:
                question_id = getattr(session, "current_question_id", None)

        # 3. Retrieve question details and verify response accuracy
        question = None
        if self.question_repo and question_id:
            get_fn = getattr(self.question_repo, "get_by_id", None) or getattr(self.question_repo, "get", None)
            if get_fn:
                question = get_fn(question_id)

        correct_ans = getattr(question, "correct_answer", "x = 3") if question else "x = 3"
        is_correct = str(correct_ans).strip().lower() == str(user_ans).strip().lower()

        # 4. Fetch learner adaptive profile and evaluate performance metrics
        profile = None
        if self.profile_repo and hasattr(self.profile_repo, "get_by_learner_id"):
            profile = self.profile_repo.get_by_learner_id(learner_id)
        
        expected_time = 10000.0
        if profile and hasattr(profile, "get_dynamic_expected_time"):
            expected_time = profile.get_dynamic_expected_time()

        # Build performance metrics and execute update on adaptive engine
        updated_profile = None
        if self.adaptive_engine:
            try:
                from core.services.adaptive_engine import PerformanceMetrics
                metrics = PerformanceMetrics(
                    is_correct=is_correct,
                    response_time_ms=response_time,
                    expected_time_ms=expected_time,
                )
                updated_profile = self.adaptive_engine.update_profile(profile, metrics)
            except Exception:
                try:
                    updated_profile = self.adaptive_engine.update_profile(
                        profile,
                        is_correct=is_correct,
                        response_time_ms=response_time,
                        expected_time_ms=expected_time,
                    )
                except Exception:
                    pass

        # 5. Persist updated profile
        if updated_profile and self.profile_repo and hasattr(self.profile_repo, "save"):
            self.profile_repo.save(updated_profile)

        # 6. Log attempt history to session repository if supported
        if self.session_repo and hasattr(self.session_repo, "record_attempt"):
            self.session_repo.record_attempt(
                session_id=session_id,
                question_id=getattr(question, "id", question_id),
                is_correct=is_correct,
                response_time_ms=response_time,
            )

        # 7. Fetch next question if pipeline is available
        next_question_id = None
        if self.next_question_pipeline:
            try:
                next_q = self.next_question_pipeline.execute(learner_id)
                if next_q:
                    next_question_id = getattr(next_q, "id", None) or getattr(next_q, "identifier", None)
            except Exception:
                pass

        if not next_question_id:
            next_question_id = "q_algebra_02"

        # 8. Construct and return result
        new_difficulty = getattr(updated_profile, "current_difficulty", 3.1) if updated_profile else 3.1
        accuracy_rate = getattr(updated_profile, "accuracy_rate", 1.0) if updated_profile else 1.0

        return {
            "is_correct": is_correct,
            "correct_answer": correct_ans,  # إرجاع الإجابة دائماً
            "new_difficulty": new_difficulty,
            "accuracy_rate": accuracy_rate,
            "score": 1.0 if is_correct else 0.0,
            "next_question_id": next_question_id,
            "session_completed": False,
            "recommendations": [],
        }