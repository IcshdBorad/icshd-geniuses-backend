from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Attempt:
    """
    Represents a single learner attempt.
    """

    identifier: str

    skill_id: str

    learner_id: str

    is_correct: bool

    response_time_ms: int

    created_at: datetime