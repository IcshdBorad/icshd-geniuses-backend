from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Attempt:
    """
    Represents a single learner attempt.

    One Attempt is created every time the learner
    submits an answer to a question.

    This object is immutable and stores both the
    learner answer and the adaptive-learning state
    generated from that answer.
    """

    # ---------------------------------------------------------
    # Identity
    # ---------------------------------------------------------

    identifier: str

    learner_id: str

    session_id: str

    question_id: str

    # ---------------------------------------------------------
    # Learner Answer
    # ---------------------------------------------------------

    submitted_answer: str

    is_correct: bool

    duration_ms: int

    attempted_at: datetime

    score: float = 1.0

    # ---------------------------------------------------------
    # Spaced Repetition
    # ---------------------------------------------------------

    review_stage: int = 0

    ease_factor: float = 2.5

    next_review: datetime | None = None

    # ---------------------------------------------------------
    # External Integration
    # ---------------------------------------------------------

    external_id: str | None = None