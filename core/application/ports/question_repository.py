from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence

from packages.contracts.question import Question


class QuestionRepository(ABC):
    """
    Repository abstraction for question persistence.

    Responsibilities
    ----------------
    - Persist questions.
    - Retrieve questions.
    - Query questions.
    """

    # ---------------------------------------------------------
    # CRUD
    # ---------------------------------------------------------

    @abstractmethod
    def get(
        self,
        identifier: str,
    ) -> Question | None:
        """
        Return a question by its identifier.
        """
        ...

    @abstractmethod
    def exists(
        self,
        identifier: str,
    ) -> bool:
        """
        Return whether a question exists.
        """
        ...

    @abstractmethod
    def save(
        self,
        question: Question,
    ) -> None:
        """
        Persist a question.
        """
        ...

    @abstractmethod
    def delete(
        self,
        identifier: str,
    ) -> None:
        """
        Delete a question.
        """
        ...

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    @abstractmethod
    def list(
        self,
    ) -> Sequence[Question]:
        """
        Return all questions.
        """
        ...

    @abstractmethod
    def count(
        self,
    ) -> int:
        """
        Return the total number of questions.
        """
        ...

    @abstractmethod
    def get_many(
        self,
        identifiers: Sequence[str],
    ) -> Sequence[Question]:
        """
        Return all questions matching the given identifiers.
        """
        ...

    @abstractmethod
    def list_by_skill(
        self,
        skill_id: str,
    ) -> Sequence[Question]:
        """
        Return all questions belonging to a skill.
        """
        ...