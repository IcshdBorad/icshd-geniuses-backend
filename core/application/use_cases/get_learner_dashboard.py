from __future__ import annotations

from core.application.ports.attempt_repository import (
    AttemptRepository,
)
from core.application.ports.learner_repository import (
    LearnerRepository,
)

from packages.contracts.attempt import Attempt
from packages.contracts.dashboard import LearnerDashboard
from packages.contracts.learner import Learner


class GetLearnerDashboardUseCase:
    """
    Builds the learner dashboard.

    Workflow
    --------
    1. Load learner.
    2. Load learner attempts.
    3. Calculate statistics.
    4. Return dashboard.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        attempts: AttemptRepository,
    ) -> None:
        self._learners = learners
        self._attempts = attempts

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner_id: str,
    ) -> LearnerDashboard:

        learner = self._load_learner(
            learner_id,
        )

        attempts = self._load_attempts(
            learner,
        )

        total_attempts = len(
            attempts,
        )

        correct_attempts = sum(
            attempt.is_correct
            for attempt in attempts
        )

        accuracy = self._calculate_accuracy(
            correct_attempts,
            total_attempts,
        )

        return LearnerDashboard(
            learner_id=learner.identifier,
            learner_name=learner.name,
            total_attempts=total_attempts,
            correct_attempts=correct_attempts,
            accuracy=accuracy,
            recommendations=learner.recommendations,
            progress=learner.skill_progress,
        )

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
        learner: Learner,
    ) -> list[Attempt]:

        return self._attempts.list_by_learner(
            learner.identifier,
        )

    @staticmethod
    def _calculate_accuracy(
        correct_attempts: int,
        total_attempts: int,
    ) -> float:

        if total_attempts == 0:
            return 0.0

        return (
            correct_attempts
            / total_attempts
        ) * 100