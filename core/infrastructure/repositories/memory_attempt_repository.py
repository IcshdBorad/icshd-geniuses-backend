from __future__ import annotations

from core.application.ports.attempt_repository import (
    AttemptRepository,
)
from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)

from packages.contracts.attempt import Attempt


class MemoryAttemptRepository(
    AttemptRepository,
):
    """
    In-memory implementation of AttemptRepository.
    """

    def __init__(
        self,
        database: MemoryDatabase,
    ) -> None:
        self._database = database

    # ---------------------------------------------------------
    # CRUD
    # ---------------------------------------------------------

    def get(
        self,
        attempt_id: str,
    ) -> Attempt | None:

        return self._database.attempts.get(
            attempt_id,
        )

    def save(
        self,
        attempt: Attempt,
    ) -> None:

        self._database.attempts[
            attempt.identifier
        ] = attempt

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    def list(
        self,
    ) -> list[Attempt]:

        return list(
            self._database.attempts.values(),
        )

    def list_by_learner(
        self,
        learner_id: str,
    ) -> list[Attempt]:

        return [
            attempt
            for attempt in self._database.attempts.values()
            if attempt.learner_id == learner_id
        ]

    def list_by_session(
        self,
        session_id: str,
    ) -> list[Attempt]:

        return [
            attempt
            for attempt in self._database.attempts.values()
            if attempt.session_id == session_id
        ]

    def get_last_attempt(
        self,
        *,
        learner_id: str,
        question_id: str,
    ) -> Attempt | None:

        attempts = [
            attempt
            for attempt in self._database.attempts.values()
            if attempt.learner_id == learner_id
            and attempt.question_id == question_id
        ]

        if not attempts:
            return None

        return max(
            attempts,
            key=lambda attempt: attempt.attempted_at,
        )

    # ---------------------------------------------------------
    # Maintenance
    # ---------------------------------------------------------

    def delete_all_by_learner(
        self,
        learner_id: str,
    ) -> None:

        identifiers = [
            attempt.identifier
            for attempt in self._database.attempts.values()
            if attempt.learner_id == learner_id
        ]

        for identifier in identifiers:
            del self._database.attempts[
                identifier
            ]