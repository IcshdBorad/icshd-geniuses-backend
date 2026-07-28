from dataclasses import dataclass


@dataclass(frozen=True)
class Skill:
    """
    Represents the smallest measurable learnable ability.
    """

    identifier: str
    name: str
    description: str

    def __str__(self) -> str:
        return f"{self.identifier} - {self.name}"