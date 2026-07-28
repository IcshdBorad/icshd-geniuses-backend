from __future__ import annotations

from dataclasses import dataclass


@dataclass(
    slots=True,
    kw_only=True,
)
class Mastery:
    """
    Represents the learner's current mastery state.

    Responsibilities
    ----------------
    - Store the learner mastery level.
    - Store performance summary values.
    - Store competency score.
    - Store mastery confidence.

    Notes
    -----
    - Accuracy is represented as a percentage (0–100).
    - Confidence is represented as a percentage (0–100).
    - Competency score is normalized to the range (0–100).
    """

    level: str = "BEGINNER"

    accuracy: float = 0.0

    average_duration_ms: float = 0.0

    competency_score: float = 0.0

    confidence: float = 0.0

    @property
    def mastered(self) -> bool:
        """
        Return whether the learner has mastered
        the evaluated content.
        """

        return self.level == "MASTERED"

    @property
    def proficient(self) -> bool:
        """
        Return whether the learner reached
        at least the proficient level.
        """

        return self.level in {
            "PROFICIENT",
            "MASTERED",
        }

    @classmethod
    def empty(
        cls,
    ) -> Mastery:
        """
        Return an empty mastery snapshot.
        """

        return cls()