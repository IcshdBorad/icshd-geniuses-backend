from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True, frozen=True)
class SubmitAnswerResponse:
    """
    Response returned after evaluating a learner answer.
    """

    is_correct: bool

    correct_answer: str

    score: float

    next_question_id: str | None

    finished: bool