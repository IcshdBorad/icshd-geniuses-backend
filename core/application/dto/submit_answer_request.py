from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True, frozen=True)
class SubmitAnswerRequest:
    """
    Request DTO used to submit a learner answer.
    """

    learner_id: str

    session_id: str

    submitted_answer: str

    duration_ms: int