from __future__ import annotations

from dataclasses import dataclass

from packages.contracts.question import Question


@dataclass(slots=True, frozen=True)
class AnswerValidationResult:
    """
    Immutable result of answer validation.
    """

    learner_answer: str
    correct_answer: str
    is_correct: bool
    score: float


class AnswerValidator:
    """
    Validates learner answers.

    Responsibilities
    ----------------
    - Normalize learner answers.
    - Compare with the expected answer.
    - Produce an immutable validation result.

    This service is completely stateless.
    """

    CORRECT_SCORE: float = 1.0
    INCORRECT_SCORE: float = 0.0

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def validate(
        self,
        submitted_answer: str,
        question: Question,
    ) -> AnswerValidationResult:
        """
        Validate a learner answer.
        """

        learner_answer = self._normalize(
            submitted_answer
        )

        correct_answer = self._normalize(
            question.answer
        )

        is_correct = (
            learner_answer == correct_answer
        )

        return AnswerValidationResult(
            learner_answer=learner_answer,
            correct_answer=correct_answer,
            is_correct=is_correct,
            score=(
                self.CORRECT_SCORE
                if is_correct
                else self.INCORRECT_SCORE
            ),
        )

    # ---------------------------------------------------------
    # Internal Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _normalize(
        value: str | None,
    ) -> str:
        """
        Normalize text before comparison.

        Rules
        -----
        - Handle None safely.
        - Trim surrounding whitespace.
        - Perform case-insensitive comparison.
        """

        if value is None:
            return ""

        return value.strip().casefold()