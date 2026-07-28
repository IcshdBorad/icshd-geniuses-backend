from __future__ import annotations

from core.application.ports.session_repository import (
    SessionRepository,
)
from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)

from packages.contracts.learning_session import (
    LearningSession,
)


class MemorySessionRepository(
    SessionRepository,
):
    """
    In-memory implementation of SessionRepository.
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
        session_id: str,
    ) -> LearningSession | None:

        return self._database.sessions.get(
            session_id,
        )

    def save(
        self,
        session: LearningSession,
    ) -> None:

        self._database.sessions[
            session.identifier
        ] = session

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    def list(
        self,
    ) -> list[LearningSession]:

        return list(
            self._database.sessions.values(),
        )

    def list_by_learner(
        self,
        learner_id: str,
    ) -> list[LearningSession]:

        return [
            session
            for session in self._database.sessions.values()
            if session.learner_id == learner_id
        ]

    def get_active_session(
        self,
        learner_id: str,
    ) -> LearningSession | None:

        sessions = [
            session
            for session in self._database.sessions.values()
            if (
                session.learner_id == learner_id
                and not session.completed
            )
        ]

        return (
            sessions[-1]
            if sessions
            else None
        )