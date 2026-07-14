from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Question:
    """
    Represents a canonical learning question.
    """

    identifier: str

    skill_id: str

    prompt: str

    answer: str

    difficulty: int

    question_type: str

    explanation: Optional[str] = None

    is_active: bool = True

    external_id: Optional[str] = None