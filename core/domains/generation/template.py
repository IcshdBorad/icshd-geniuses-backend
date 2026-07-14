from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class QuestionTemplate:
    """
    Defines how one type of question is generated.
    """

    identifier: str
    skill_id: str
    name: str
    template: str
    difficulty: int = 1
    enabled: bool = True
    metadata: dict[str, Any] | None = None

    def render(self) -> str:
        return self.template