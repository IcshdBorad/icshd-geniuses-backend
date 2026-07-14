from dataclasses import dataclass


@dataclass(frozen=True)
class SkillStatus:
    """
    Represents learner mastery of one skill.
    """

    learner_id: str

    skill_id: str

    attempts: int

    accuracy: float

    average_time_ms: float

    mastered: bool