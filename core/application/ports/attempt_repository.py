from __future__ import annotations

from typing import Protocol

from packages.contracts.attempt import Attempt


class AttemptRepository(Protocol):
    """
    Repository responsible for persisting learner attempts.
    """

    # ---------------------------------------------------------
    # Single Attempt
    # ---------------------------------------------------------

    def get(
        self,
        attempt_id: str,
    ) -> Attempt | None:
        ...

    def get_last_attempt(
        self,
        *,
        learner_id: str,
        question_id: str,
    ) -> Attempt | None:
        """
        Return the latest attempt for a learner on a question.
        """
        ...

    # ---------------------------------------------------------
    # Persistence
    # ---------------------------------------------------------

    def save(
        self,
        attempt: Attempt,
    ) -> None:
        ...

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    def list(
        self,
    ) -> list[Attempt]:
        ...

    def list_by_learner(
        self,
        learner_id: str,
    ) -> list[Attempt]:
        ...

    def list_by_session(
        self,
        session_id: str,
    ) -> list[Attempt]:
        ...

    # ---------------------------------------------------------
    # Maintenance
    # ---------------------------------------------------------

    def delete_all_by_learner(
        self,
        learner_id: str,
    ) -> None:
        """
        Remove all attempts belonging to a learner.
        """
        ...