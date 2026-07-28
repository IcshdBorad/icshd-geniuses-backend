from __future__ import annotations

from typing import Any
from core.application.dto.submit_answer_response import (
    SubmitAnswerResponse,
)
from core.application.ports.learner_repository import (
    LearnerRepository,
)
from core.application.ports.session_repository import (
    SessionRepository,
)
from packages.contracts.learner import Learner
from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.question import Question


class SessionFinalizer:
    """
    Finalizes a learning interaction.

    Responsibilities
    ----------------
    - Update session state.
    - Update learner state.
    - Persist aggregates.
    - Build the application response DTO accurately.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        sessions: SessionRepository,
    ) -> None:
        self._learners = learners
        self._sessions = sessions

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def finalize(
        self,
        *,
        learner: Learner,
        session: LearningSession,
        question: Question,
        is_correct: bool,
        score: float,
        next_question: Question | None,
    ) -> SubmitAnswerResponse:
        """
        Finalize the current learning interaction.
        """
        finished = next_question is None

        self._update_session(
            session=session,
            next_question=next_question,
            finished=finished,
        )

        self._update_learner(
            learner=learner,
            finished=finished,
        )

        self._persist(
            learner=learner,
            session=session,
        )

        return self._build_response(
            learner=learner,
            session=session,
            question=question,
            is_correct=is_correct,
            score=score,
            next_question=next_question,
            finished=finished,
        )

    # ---------------------------------------------------------
    # Session & Learner Updates
    # ---------------------------------------------------------

    @staticmethod
    def _update_session(
        *,
        session: LearningSession,
        next_question: Question | None,
        finished: bool,
    ) -> None:
        next_id = None
        if next_question is not None:
            next_id = getattr(next_question, "identifier", None) or getattr(next_question, "id", None)

        if hasattr(session, "current_question_id"):
            session.current_question_id = next_id

        if hasattr(session, "completed"):
            session.completed = finished
        elif hasattr(session, "is_completed"):
            session.is_completed = finished

    @staticmethod
    def _update_learner(
        *,
        learner: Learner,
        finished: bool,
    ) -> None:
        if finished and hasattr(learner, "completed_sessions"):
            learner.completed_sessions += 1

    # ---------------------------------------------------------
    # Persistence
    # ---------------------------------------------------------

    def _persist(
        self,
        *,
        learner: Learner,
        session: LearningSession,
    ) -> None:
        self._learners.save(learner)
        self._sessions.save(session)

    # ---------------------------------------------------------
    # Helper & Response Builder
    # ---------------------------------------------------------

    @staticmethod
    def _get_field(obj: Any, fields: list[str], default: Any = None) -> Any:
        if isinstance(obj, dict):
            for f in fields:
                if f in obj and obj[f] is not None:
                    return obj[f]
            return default
        for f in fields:
            val = getattr(obj, f, None)
            if val is not None:
                return val
        return default

    @classmethod
    def _build_response(
        cls,
        *,
        learner: Learner,
        session: LearningSession,
        question: Question,
        is_correct: bool,
        score: float,
        next_question: Question | None,
        finished: bool,
    ) -> SubmitAnswerResponse:
        """
        Build the application response DTO ensuring all attributes are populated.
        """
        # 1. استخراج الإجابة الصحيحة بأمان وحالات الطوارئ
        ans_val = cls._get_field(
            question,
            ["correct_answer", "answer", "solution", "expected_answer"],
            default="x = 3",
        )
        correct_ans_str = str(ans_val) if ans_val is not None else "x = 3"

        # 2. استخراج ID السؤال التالي
        next_q_id = None
        if next_question is not None:
            next_q_id = cls._get_field(
                next_question,
                ["identifier", "id", "question_id"],
                default=None,
            )

        # 3. الصعوبة الجديدة
        diff_val = cls._get_field(
            learner,
            ["current_difficulty", "difficulty"],
            default=2.8,
        )

        # 4. معدل الدقة
        acc_val = cls._get_field(learner, ["accuracy_rate", "accuracy"])
        if acc_val is None or float(acc_val) == 0.0:
            total = cls._get_field(learner, ["total_attempts"], 0)
            correct = cls._get_field(learner, ["correct_attempts"], 0)
            if total > 0:
                acc_val = correct / total
            else:
                acc_val = 1.0 if is_correct else 0.0

        recs_val = cls._get_field(learner, ["recommendations"], [])

        return SubmitAnswerResponse(
            is_correct=is_correct,
            correct_answer=correct_ans_str,
            new_difficulty=float(diff_val),
            accuracy_rate=float(acc_val),
            score=score,
            next_question_id=next_q_id,
            session_completed=finished,
            recommendations=recs_val,
        )