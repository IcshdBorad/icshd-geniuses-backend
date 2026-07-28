from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class SkillProgress:
    """
    Persistent learner progress for a single skill.

    Stores long-term statistics and spaced repetition
    information for one skill.
    """

    # ---------------------------------------------------------
    # Identity
    # ---------------------------------------------------------

    skill_id: str

    # ---------------------------------------------------------
    # Learning Statistics
    # ---------------------------------------------------------

    attempts: int = 0

    correct: int = 0

    incorrect: int = 0

    accuracy: float = 0.0          # Percentage (0-100)

    competency: float = 0.0        # Percentage (0-100)

    mastered: bool = False

    last_correct: bool = False

    # ---------------------------------------------------------
    # Timing Statistics
    # ---------------------------------------------------------

    total_time_ms: int = 0

    average_time_ms: float = 0.0

    # ---------------------------------------------------------
    # Spaced Repetition
    # ---------------------------------------------------------

    review_stage: int = 0

    ease_factor: float = 2.5

    next_review: Optional[datetime] = None

    last_review: Optional[datetime] = None

    # ---------------------------------------------------------
    # Forgetting
    # ---------------------------------------------------------

    forgetting_probability: float = 1.0

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    def register_attempt(
        self,
        is_correct: bool,
        duration_ms: int,
    ) -> None:
        """
        Updates learning statistics after one attempt.
        """

        self.attempts += 1
        self.last_correct = is_correct

        if is_correct:
            self.correct += 1
        else:
            self.incorrect += 1

        self.accuracy = round(
            (self.correct / self.attempts) * 100,
            2,
        )

        self.total_time_ms += duration_ms

        self.average_time_ms = round(
            self.total_time_ms / self.attempts,
            2,
        )

    # ---------------------------------------------------------
    # Spaced Repetition
    # ---------------------------------------------------------

    def update_review(
        self,
        review_stage: int,
        ease_factor: float,
        next_review: Optional[datetime],
        attempted_at: datetime,
    ) -> None:
        """
        Updates spaced repetition values.
        """

        self.review_stage = review_stage
        self.ease_factor = ease_factor
        self.next_review = next_review
        self.last_review = attempted_at

    # ---------------------------------------------------------
    # Forgetting
    # ---------------------------------------------------------

    def update_forgetting_probability(
        self,
        probability: float,
    ) -> None:
        """
        Stores current forgetting probability.
        """

        self.forgetting_probability = max(
            0.0,
            min(1.0, probability),
        )

    # ---------------------------------------------------------
    # Mastery
    # ---------------------------------------------------------

    def evaluate_mastery(self) -> bool:
        """
        Evaluates whether the learner mastered
        this skill.

        Returns:
            bool: mastery state.
        """

        self.mastered = (
            self.attempts >= 10
            and self.accuracy >= 90.0
            and self.review_stage >= 3
        )

        return self.mastered