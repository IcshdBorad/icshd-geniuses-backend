from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True, frozen=True)
class CreateSessionResult:
    """
    Result returned after creating a new learning session.
    """

    session_id: str

    learner_id: str

    question_id: str

    started_at: datetime