from __future__ import annotations

from dataclasses import dataclass

from packages.contracts.question import Question
from packages.contracts.learning.submit_answer_request import (
    SubmitAnswerRequest,
)


@dataclass(slots=True, frozen=True)
class AnswerValidationResult:
    """
    Result returned after validating a learner answer.
    """

    is_correct: bool

    score: float


class AnswerValidator:
    """
    Validates learner answers.

    Responsibilities
    ----------------
    - Compare learner answer with expected answer.
    - Calculate earned score.
    - Return an immutable validation result.

    This service is completely stateless.
    """

    FULL_SCORE = 1.0
    ZERO_SCORE = 0.0

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def validate(
        self,
        *,
        question: Question,
        request: SubmitAnswerRequest,
    ) -> AnswerValidationResult:
        """
        Validate a learner answer.
        """

        is_correct = self._is_correct(
            expected=question.answer,
            submitted=request.submitted_answer,
        )

        return AnswerValidationResult(
            is_correct=is_correct,
            score=self._score(is_correct),
        )

    # ---------------------------------------------------------
    # Internal Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _normalize(
        text: str,
    ) -> str:
        """
        Normalize text before comparison.
        """

        return text.strip().casefold()

    def _is_correct(
        self,
        *,
        expected: str,
        submitted: str,
    ) -> bool:
        """
        Compare expected and submitted answers.
        """

        return (
            self._normalize(expected)
            == self._normalize(submitted)
        )

    def _score(
        self,
        is_correct: bool,
    ) -> float:
        """
        Calculate earned score.
        """

        return (
            self.FULL_SCORE
            if is_correct
            else self.ZERO_SCORE
        )