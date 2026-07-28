from __future__ import annotations

from uuid import uuid4

from core.application.dto.submit_answer_request import (
    SubmitAnswerRequest,
)
from core.application.ports.attempt_repository import (
    AttemptRepository,
)
from core.application.ports.clock import Clock

from core.services.learning.answer_validator import (
    AnswerValidationResult,
)
from core.services.spaced_repetition import (
    SpacedRepetition,
)

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.question import Question


class AttemptFactory:
    """
    Builds Attempt entities.

    Responsibilities
    ----------------
    - Load previous learner attempt.
    - Determine review stage.
    - Update ease factor.
    - Delegate review scheduling to SpacedRepetition.
    - Create the Attempt entity.

    This service contains no persistence logic.
    """

    def __init__(
        self,
        attempts: AttemptRepository,
        spaced_repetition: SpacedRepetition,
        clock: Clock,
    ) -> None:

        self._attempts = attempts
        self._spaced_repetition = spaced_repetition
        self._clock = clock

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def create(
        self,
        learner: Learner,
        session: LearningSession,
        question: Question,
        request: SubmitAnswerRequest,
        validation: AnswerValidationResult,
    ) -> Attempt:

        previous_attempt = self._attempts.get_last_attempt(
            learner_id=learner.identifier,
            question_id=question.identifier,
        )

        review_stage = self._calculate_review_stage(
            previous_attempt=previous_attempt,
            is_correct=validation.is_correct,
        )

        ease_factor = self._calculate_ease_factor(
            previous_attempt=previous_attempt,
            is_correct=validation.is_correct,
        )

        attempted_at = self._clock.now()

        next_review = (
            self._spaced_repetition.calculate_next_review(
                attempted_at=attempted_at,
                review_stage=review_stage,
                is_correct=validation.is_correct,
            )
        )

        return Attempt(
            identifier=str(uuid4()),
            learner_id=learner.identifier,
            session_id=session.identifier,
            question_id=question.identifier,
            submitted_answer=request.submitted_answer,
            is_correct=validation.is_correct,
            score=validation.score,
            duration_ms=request.duration_ms,
            attempted_at=attempted_at,
            review_stage=review_stage,
            ease_factor=ease_factor,
            next_review=next_review,
        )

    # ---------------------------------------------------------
    # Review Stage
    # ---------------------------------------------------------

    def _calculate_review_stage(
        self,
        previous_attempt: Attempt | None,
        is_correct: bool,
    ) -> int:

        if previous_attempt is None:
            return 0

        if not is_correct:
            return 0

        next_stage = previous_attempt.review_stage + 1

        return min(
            next_stage,
            self._spaced_repetition.MAX_REVIEW_STAGE,
        )

    # ---------------------------------------------------------
    # Ease Factor
    # ---------------------------------------------------------

    def _calculate_ease_factor(
        self,
        previous_attempt: Attempt | None,
        is_correct: bool,
    ) -> float:

        if previous_attempt is None:
            previous_ease = (
                self._spaced_repetition.DEFAULT_EASE_FACTOR
            )
        else:
            previous_ease = previous_attempt.ease_factor

        return self._spaced_repetition.calculate_ease_factor(
            previous_ease_factor=previous_ease,
            is_correct=is_correct,
        )