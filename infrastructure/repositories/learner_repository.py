from __future__ import annotations

from typing import Protocol

from packages.contracts.learner import Learner


class LearnerRepository(Protocol):

    def get(
        self,
        learner_id: str,
    ) -> Learner | None:
        ...

    def save(
        self,
        learner: Learner,
    ) -> None:
        ...

    def list(self) -> list[Learner]:
        ...