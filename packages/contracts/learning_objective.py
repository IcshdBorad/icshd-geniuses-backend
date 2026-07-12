from dataclasses import dataclass


@dataclass(frozen=True)
class LearningObjective:
    """
    Represents a learning objective.
    """

    identifier: str
    name: str
    description: str

    standard_id: str