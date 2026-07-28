from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class LearningSession:
    """
    Represents an active adaptive learning session.

    One session starts when the learner begins learning
    and finishes when there are no more questions to ask.
    """

    # ---------------------------------------------------------
    # Identity
    # ---------------------------------------------------------

    identifier: str

    learner_id: str

    # ---------------------------------------------------------
    # Session State
    # ---------------------------------------------------------

    started_at: datetime

    completed: bool = False

    current_question_id: str | None = None

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    answered_questions: int = 0

    total_score: float = 0.0