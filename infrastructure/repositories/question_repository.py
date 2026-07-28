from __future__ import annotations

from typing import Protocol

from packages.contracts.question import Question


class QuestionRepository(Protocol):
    """
    Repository interface for questions.
    """

    def get(
        self,
        identifier: str,
    ) -> Question | None:
        ...

    def save(
        self,
        question: Question,
    ) -> None:
        ...

    def list(
        self,
    ) -> list[Question]:
        ...