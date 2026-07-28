from __future__ import annotations

from dataclasses import dataclass

from packages.contracts.learner import Learner
from packages.contracts.skill_progress import SkillProgress


@dataclass(slots=True, frozen=True)
class RecommendationPipelineResult:
    """
    Result produced by the recommendation pipeline.
    """

    recommendations: list[str]


class RecommendationPipeline:
    """
    Generates adaptive learning recommendations.

    Responsibilities
    ----------------
    - Inspect learner skill progress.
    - Generate personalized recommendations.
    - Update learner recommendations.

    This service is stateless.
    """

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        *,
        learner: Learner,
        progress: SkillProgress,
    ) -> RecommendationPipelineResult:
        """
        Generate recommendations for the learner.
        """

        recommendations = self._build_recommendations(
            progress,
        )

        learner.recommendations = recommendations

        return RecommendationPipelineResult(
            recommendations=recommendations,
        )

    # ---------------------------------------------------------
    # Recommendation Rules
    # ---------------------------------------------------------

    @staticmethod
    def _build_recommendations(
        progress: SkillProgress,
    ) -> list[str]:
        """
        Generate recommendations from learner progress.
        """

        recommendations: list[str] = []

        if progress.mastered:

            recommendations.append(
                "Move to the next skill."
            )

        elif progress.accuracy >= 85:

            recommendations.append(
                "Practice a few more questions before advancing."
            )

        elif progress.accuracy >= 60:

            recommendations.append(
                "Continue practicing this skill."
            )

        else:

            recommendations.append(
                "Review the lesson and retry easier questions."
            )

        if progress.review_stage == 0:

            recommendations.append(
                "Review this skill again soon."
            )

        if progress.ease_factor < 2.0:

            recommendations.append(
                "Repeat this skill until it becomes easier."
            )

        return recommendations