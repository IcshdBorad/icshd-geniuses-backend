from dataclasses import dataclass


@dataclass(frozen=True)
class LearningSession:
    """
    Represents one learning session.
    """

    identifier: str

    learner_id: str

    completed: bool = False