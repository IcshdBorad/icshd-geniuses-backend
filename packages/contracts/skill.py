from dataclasses import dataclass, field


@dataclass(frozen=True)
class Skill:
    """
    Represents the smallest measurable learning ability.

    Skills may depend on one or more prerequisite skills,
    allowing the Learning Engine to build adaptive learning
    paths.
    """

    identifier: str

    name: str

    description: str

    standard_id: str

    objective_id: str

    prerequisites: list[str] = field(
        default_factory=list
    )

    is_active: bool = True

    external_id: str | None = None