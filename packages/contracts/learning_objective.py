from dataclasses import dataclass


@dataclass(frozen=True)
class LearningObjective:
    """
    Represents a learning objective.
    """

    identifier: str

    standard_id: str

    name: str
    description: str

    is_active: bool = True

    external_id: str | None = None