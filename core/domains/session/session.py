from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class LearningSession:

    identifier: str

    learner_id: str

    started_at: datetime

    finished_at: datetime | None = None

    completed: bool = False