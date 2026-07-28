from __future__ import annotations

from typing import Any
from packages.contracts.learner import Learner
from packages.contracts.skill import Skill
from packages.contracts.skill_progress import SkillProgress


class SkillPriority:
    """
    Adaptive Skill Priority Engine.

    Responsibilities
    ----------------
    - Evaluate learner weakness.
    - Estimate required practice.
    - Prioritize review stages.
    - Consider forgetting probability.
    - Consider learner competency.
    - Consider curriculum importance.
    - Rank learner skills.

    Produces a normalized priority score where higher values
    indicate higher learning priority.

    This service is completely stateless.
    """

    MAX_SCORE: float = 100.0
    MAX_ATTEMPTS: int = 100
    MAX_REVIEW_STAGE: int = 6
    REVIEW_STAGE_SCORE: float = 15.0

    WEAKNESS_WEIGHT: float = 0.35
    PRACTICE_WEIGHT: float = 0.15
    REVIEW_WEIGHT: float = 0.15
    FORGETTING_WEIGHT: float = 0.15
    COMPETENCY_WEIGHT: float = 0.10
    IMPORTANCE_WEIGHT: float = 0.10

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def score(
        self,
        learner: Learner,
        skill: Skill,
        progress: SkillProgress,
    ) -> float:
        """
        Calculate the adaptive priority score of a skill.

        Higher score = higher learning priority.
        """
        score = (
            self._weakness(progress) * self.WEAKNESS_WEIGHT
            + self._practice(progress) * self.PRACTICE_WEIGHT
            + self._review(progress) * self.REVIEW_WEIGHT
            + self._forgetting(progress) * self.FORGETTING_WEIGHT
            + self._competency_gap(learner) * self.COMPETENCY_WEIGHT
            + self._importance(skill) * self.IMPORTANCE_WEIGHT
        )

        return round(score, 2)

    # ---------------------------------------------------------
    # Ranking
    # ---------------------------------------------------------

    def sort(
        self,
        learner: Learner,
        skills: list[Skill],
        progress: dict[str, SkillProgress],
    ) -> list[Skill]:
        """
        Return all skills sorted from highest priority to lowest priority.
        """
        return sorted(
            skills,
            key=lambda skill: self.score(
                learner=learner,
                skill=skill,
                progress=progress[skill.identifier],
            ),
            reverse=True,
        )

    def highest_priority(
        self,
        learner: Learner,
        skills: list[Skill],
        progress: dict[str, SkillProgress],
    ) -> Skill | None:
        """
        Return the highest-priority skill.

        Returns None when no skills are available.
        """
        ranked = self.sort(
            learner=learner,
            skills=skills,
            progress=progress,
        )

        return ranked[0] if ranked else None

    # ---------------------------------------------------------
    # Private Helper / Component Methods
    # ---------------------------------------------------------

    def _weakness(self, progress: SkillProgress) -> float:
        """Lower accuracy increases priority."""
        return max(0.0, self.MAX_SCORE - progress.accuracy)

    def _practice(self, progress: SkillProgress) -> float:
        """Skills with fewer attempts receive higher priority."""
        attempts = min(progress.attempts, self.MAX_ATTEMPTS)
        return float(self.MAX_SCORE - attempts)

    def _review(self, progress: SkillProgress) -> float:
        """Earlier review stages receive higher priority."""
        remaining = self.MAX_REVIEW_STAGE - progress.review_stage
        return max(0.0, float(remaining * self.REVIEW_STAGE_SCORE))

    @staticmethod
    def _forgetting(progress: SkillProgress) -> float:
        """Convert forgetting probability into percentage."""
        return float(progress.forgetting_probability * 100.0)

    def _competency_gap(self, learner: Learner) -> float:
        """
        Lower learner competency increases learning priority.
        Handles both Value Object/Dataclass and Dictionary structures safely.
        """
        competency: Any = getattr(learner, "competency", None)

        if competency is None:
            return self.MAX_SCORE

        if isinstance(competency, dict):
            overall = float(competency.get("overall_competency", 0.0))
        else:
            overall = float(getattr(competency, "overall_competency", 0.0))

        return max(0.0, self.MAX_SCORE - overall)

    def _importance(self, skill: Skill) -> float:
        """Return normalized curriculum importance."""
        importance = float(getattr(skill, "importance", 1.0))
        return importance * self.MAX_SCORE