from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from packages.contracts.skill_progress import SkillProgress


@dataclass
class Learner:
    """
    Represents a learner in the adaptive learning platform.

    This object stores both the learner profile and the
    persistent adaptive-learning state that survives across
    learning sessions.
    """

    # ---------------------------------------------------------
    # Identity
    # ---------------------------------------------------------

    identifier: str

    name: str

    email: str = ""

    is_active: bool = True

    # ---------------------------------------------------------
    # Learning State
    # ---------------------------------------------------------

    current_level: int = 1

    current_difficulty: int = 1

    mastery_score: float = 0.0

    competency_score: float = 0.0

    competency: dict[str, Any] = field(
        default_factory=dict
    )

    mastery: dict[str, Any] = field(
        default_factory=dict
    )

    # ---------------------------------------------------------
    # Global Statistics
    # ---------------------------------------------------------

    completed_sessions: int = 0

    total_attempts: int = 0

    total_correct: int = 0

    total_score: float = 0.0

    # ---------------------------------------------------------
    # Skill Progress
    # ---------------------------------------------------------

    skill_progress: dict[str, SkillProgress] = field(
        default_factory=dict
    )

    mastered_skills: list[str] = field(
        default_factory=list
    )

    # ---------------------------------------------------------
    # Adaptive Learning
    # ---------------------------------------------------------

    recommendations: list[str] = field(
        default_factory=list
    )

    learner_profile: dict[str, Any] = field(
        default_factory=dict
    )

    # ---------------------------------------------------------
    # Review
    # ---------------------------------------------------------

    last_review_date: datetime | None = None

    # ---------------------------------------------------------
    # Skill Progress Helpers
    # ---------------------------------------------------------

    def get_skill_progress(
        self,
        skill_id: str,
    ) -> SkillProgress:
        """
        Returns the SkillProgress object for the
        requested skill.

        Creates it automatically if necessary.
        """

        progress = self.skill_progress.get(
            skill_id
        )

        if progress is None:

            progress = SkillProgress(
                skill_id=skill_id,
            )

            self.skill_progress[
                skill_id
            ] = progress

        return progress

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    def register_attempt(
        self,
        is_correct: bool,
        score: float,
    ) -> None:
        """
        Updates learner-wide statistics after
        answering a question.
        """

        self.total_attempts += 1

        if is_correct:
            self.total_correct += 1

        self.total_score += score

        if self.total_attempts > 0:

            self.mastery_score = round(
                (
                    self.total_correct
                    / self.total_attempts
                )
                * 100,
                2,
            )

    # ---------------------------------------------------------
    # Competency
    # ---------------------------------------------------------

    def update_competency(
        self,
        competency: dict[str, Any],
    ) -> None:
        """
        Stores competency evaluation.
        """

        self.competency = competency

        self.competency_score = competency.get(
            "overall_competency",
            0.0,
        )

    # ---------------------------------------------------------
    # Mastery
    # ---------------------------------------------------------

    def update_mastery(
        self,
        mastery: dict[str, Any],
    ) -> None:
        """
        Stores mastery evaluation.
        """

        self.mastery = mastery

        self.mastery_score = mastery.get(
            "mastery_score",
            self.mastery_score,
        )

    # ---------------------------------------------------------
    # Mastered Skills
    # ---------------------------------------------------------

    def mark_skill_mastered(
        self,
        skill_id: str,
    ) -> None:
        """
        Adds a mastered skill only once.
        """

        if skill_id not in self.mastered_skills:

            self.mastered_skills.append(
                skill_id
            )

    # ---------------------------------------------------------
    # Sessions
    # ---------------------------------------------------------

    def complete_session(
        self,
    ) -> None:
        """
        Increments the completed session count.
        """

        self.completed_sessions += 1