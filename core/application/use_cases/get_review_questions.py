from __future__ import annotations

from collections.abc import Sequence

from core.application.ports.attempt_repository import (
    AttemptRepository,
)
from core.application.ports.learner_repository import (
    LearnerRepository,
)
from core.application.ports.question_repository import (
    QuestionRepository,
)

from core.services.spaced_repetition import (
    SpacedRepetition,
)

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.question import Question


class GetReviewQuestionsUseCase:
    """
    Returns all questions currently due for review.

    Workflow
    --------
    1. Load learner.
    2. Load learner attempts.
    3. Determine due question identifiers.
    4. Load all questions.
    5. Return due questions.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        attempts: AttemptRepository,
        questions: QuestionRepository,
        spaced_repetition: SpacedRepetition,
    ) -> None:

        self._learners = learners
        self._attempts = attempts
        self._questions = questions
        self._spaced_repetition = spaced_repetition

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner_id: str,
    ) -> list[Question]:

        learner = self._load_learner(
            learner_id,
        )

        attempts = self._load_attempts(
            learner.identifier,
        )

        due_question_ids = (
            self._spaced_repetition.due_question_ids(
                attempts,
            )
        )

        if not due_question_ids:
            return []

        return [
            question
            for question in self._questions.list()
            if question.identifier in due_question_ids
        ]

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    def _load_learner(
        self,
        learner_id: str,
    ) -> Learner:

        learner = self._learners.get(
            learner_id,
        )

        if learner is None:
            raise ValueError(
                f"Learner '{learner_id}' not found."
            )

        return learner

    def _load_attempts(
        self,
        learner_id: str,
    ) -> Sequence[Attempt]:

        return self._attempts.list_by_learner(
            learner_id,
        )