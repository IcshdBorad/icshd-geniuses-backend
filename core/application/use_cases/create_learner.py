from __future__ import annotations

from core.application.ports.learner_repository import (
    LearnerRepository,
)

from packages.contracts.learner import Learner


class CreateLearnerUseCase:
    """
    Creates a new learner.

    Responsibilities
    ----------------
    - Validate learner uniqueness.
    - Persist learner.
    - Return the created learner.

    This use case delegates persistence to the repository.
    """

    def __init__(
        self,
        learners: LearnerRepository,
    ) -> None:
        self._learners = learners

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner: Learner,
    ) -> Learner:
        """
        Create a learner.
        """

        existing = self._learners.get(
            learner.identifier,
        )

        if existing is not None:
            raise ValueError(
                f"Learner '{learner.identifier}' already exists."
            )

        self._learners.save(
            learner,
        )

        return learner