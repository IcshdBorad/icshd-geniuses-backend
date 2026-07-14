from dataclasses import dataclass


@dataclass(frozen=True)
class Skill:
    """
    Represents the smallest measurable learning ability.
    """

    identifier: str

    name: str
    description: str

    standard_id: str
    objective_id: str

    is_active: bool = True

    external_id: str | None = None