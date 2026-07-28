from __future__ import annotations

from collections.abc import Sequence

from core.application.ports.question_repository import (
    QuestionRepository,
)
from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)
from packages.contracts.question import Question


class MemoryQuestionRepository(
    QuestionRepository,
):
    """
    In-memory implementation of QuestionRepository.
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
        identifier: str,
    ) -> Question | None:
        return self._database.questions.get(
            identifier,
        )

    def get_by_id(
        self,
        identifier: str,
    ) -> Question | None:
        """
        Retrieve a question by identifier (alias for get).
        """
        return self.get(identifier)

    def get_many(
        self,
        identifiers: Sequence[str],
    ) -> Sequence[Question]:
        """
        Retrieve multiple questions by their identifiers.
        """
        return tuple(
            self._database.questions[ident]
            for ident in identifiers
            if ident in self._database.questions
        )

    def save(
        self,
        question: Question,
    ) -> None:
        self._database.questions[
            question.identifier
        ] = question

    def delete(
        self,
        identifier: str,
    ) -> None:
        """
        Delete a question by identifier.
        """
        self._database.questions.pop(
            identifier,
            None,
        )

    # ---------------------------------------------------------
    # Queries & Helpers
    # ---------------------------------------------------------

    def list(
        self,
    ) -> list[Question]:
        return list(
            self._database.questions.values(),
        )

    def list_by_skill(
        self,
        skill_id: str,
    ) -> list[Question]:
        return [
            question
            for question in self._database.questions.values()
            if getattr(question, "skill_id", None) == skill_id
        ]

    def exists(
        self,
        identifier: str,
    ) -> bool:
        """
        Check if a question exists by identifier.
        """
        return identifier in self._database.questions

    def count(
        self,
    ) -> int:
        """
        Return the total count of stored questions.
        """
        return len(self._database.questions)

    def get_next_question(
        self,
        target_difficulty: float,
        skill_id: str | None = None,
        exclude_ids: Sequence[str] | None = None,
    ) -> Question | None:
        """
        Retrieve the closest question matching target_difficulty while excluding solved IDs.
        """
        exclude = set(exclude_ids or [])

        # 1. تصفية الأسئلة بالاعتماد على المهارة (إن وُجدت) مع استثناء الأسئلة السابقة
        if skill_id:
            available = [
                q for q in self._database.questions.values()
                if getattr(q, "skill_id", None) == skill_id and q.identifier not in exclude
            ]
        else:
            available = []

        # 2. Fallback: إذا لم تتوفر أسئلة لنفس المهارة، جلب أي أسئلة متبقية من قاعدة البيانات
        if not available:
            available = [
                q for q in self._database.questions.values()
                if q.identifier not in exclude
            ]

        if not available:
            return None

        # 3. فرز الأسئلة بالأقرب لمستوى الصعوبة المستهدف (Closest Match)
        available.sort(
            key=lambda q: abs(getattr(q, "difficulty", 1.0) - target_difficulty)
        )
        return available[0]