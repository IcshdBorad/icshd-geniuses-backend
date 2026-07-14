from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class Attempt:
    """
    Represents a learner attempt on a question.
    """

    identifier: str

    learner_id: str

    question_id: str

    submitted_answer: str

    is_correct: bool

    duration_ms: int

    attempted_at: datetime

    score: float = 1.0

    external_id: Optional[str] = None