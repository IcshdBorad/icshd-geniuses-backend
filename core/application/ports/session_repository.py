from __future__ import annotations

from typing import Protocol

from packages.contracts.learning_session import LearningSession


class SessionRepository(Protocol):
    """
    Persistence contract for learning sessions.
    """

    def get(
        self,
        session_id: str,
    ) -> LearningSession | None:
        ...

    def save(
        self,
        session: LearningSession,
    ) -> None:
        ...

    def list(
        self,
    ) -> list[LearningSession]:
        ...