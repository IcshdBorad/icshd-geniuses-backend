from __future__ import annotations

from core.application.ports.question_repository import (
    QuestionRepository,
)

from packages.contracts.question import Question


class GenerationService:
    """
    Question Generation Service.

    Responsibilities
    ----------------
    - Persist generated questions.
    - Retrieve generated questions.

    This service is independent of the underlying
    persistence implementation.
    """

    def __init__(
        self,
        questions: QuestionRepository,
    ) -> None:

        self._questions = questions

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------

    def save_question(
        self,
        question: Question,
    ) -> None:
        """
        Saves a generated question.
        """

        self._questions.save(
            question
        )

    # ---------------------------------------------------------
    # Get
    # ---------------------------------------------------------

    def get_question(
        self,
        identifier: str,
    ) -> Question | None:
        """
        Returns a question by identifier.
        """

        return self._questions.get(
            identifier
        )

    # ---------------------------------------------------------
    # List
    # ---------------------------------------------------------

    def list_questions(
        self,
    ) -> list[Question]:
        """
        Returns all generated questions.
        """

        return self._questions.list()