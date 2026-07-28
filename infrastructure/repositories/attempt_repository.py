from __future__ import annotations

from typing import Protocol

from packages.contracts.attempt import Attempt


class AttemptRepository(Protocol):
    """
    Repository interface for learner attempts.
    """

    def get(
        self,
        identifier: str,
    ) -> Attempt | None:
        ...

    def save(
        self,
        attempt: Attempt,
    ) -> None:
        ...

    def list(
        self,
    ) -> list[Attempt]:
        ...

    def get_last_attempt(
        self,
        learner_id: str,
        question_id: str,
    ) -> Attempt | None:
        ...