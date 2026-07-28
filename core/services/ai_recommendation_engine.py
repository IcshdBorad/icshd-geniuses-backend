from __future__ import annotations

from packages.contracts.mastery import Mastery
from packages.contracts.performance import Performance


class AIRecommendationEngine:
    """
    Rule-Based Learning Recommendation Engine.

    Responsibilities
    ----------------
    - Analyze learner performance.
    - Analyze learner mastery.
    - Produce personalized learning recommendations.
    - Recommend review intensity.
    - Recommend progression strategy.

    Notes
    -----
    This implementation is intentionally rule-based.

    The public interface is designed so that the engine can
    later be replaced by an AI/LLM implementation without
    affecting the application layer.
    """

    LOW_ACCURACY = 0.60
    HIGH_ACCURACY = 0.85

    SLOW_RESPONSE_MS = 8_000

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def recommend(
        self,
        performance: Performance,
        mastery: Mastery,
    ) -> list[str]:
        """
        Generate personalized recommendations.

        Parameters
        ----------
        performance:
            Current learner performance snapshot.

        mastery:
            Current learner mastery snapshot.

        Returns
        -------
        list[str]
            Ordered list of learning recommendations.
        """

        recommendations: list[str] = []

        recommendations.extend(
            self._accuracy_recommendations(
                performance.accuracy,
            )
        )

        recommendations.extend(
            self._speed_recommendations(
                performance.average_duration_ms,
            )
        )

        recommendations.extend(
            self._mastery_recommendations(
                mastery,
            )
        )

        return self._unique(
            recommendations,
        )

    # ---------------------------------------------------------
    # Accuracy
    # ---------------------------------------------------------

    def _accuracy_recommendations(
        self,
        accuracy: float,
    ) -> list[str]:
        """
        Generate recommendations based on learner accuracy.
        """

        if accuracy < self.LOW_ACCURACY:

            return [
                "Practice easier questions before progressing.",
                "Focus on understanding concepts rather than speed.",
            ]

        if accuracy < self.HIGH_ACCURACY:

            return [
                "Continue practicing the current skill.",
            ]

        return [
            "You are ready for more challenging questions.",
        ]

    # ---------------------------------------------------------
    # Response Speed
    # ---------------------------------------------------------

    def _speed_recommendations(
        self,
        average_duration_ms: float,
    ) -> list[str]:
        """
        Generate recommendations based on response speed.
        """

        if average_duration_ms > self.SLOW_RESPONSE_MS:

            return [
                "Try improving your response speed.",
            ]

        return []

    # ---------------------------------------------------------
    # Mastery
    # ---------------------------------------------------------

    @staticmethod
    def _mastery_recommendations(
        mastery: Mastery,
    ) -> list[str]:
        """
        Generate recommendations from learner mastery.
        """

        match mastery.level:

            case "MASTERED":

                return [
                    "Move to the next skill.",
                ]

            case "PROFICIENT":

                return [
                    "Perform a light review before progressing.",
                ]

            case "LEARNING":

                return [
                    "Continue practicing this skill.",
                ]

            case _:

                return [
                    "Focus on mastering the fundamentals.",
                ]

    # ---------------------------------------------------------
    # Utilities
    # ---------------------------------------------------------

    @staticmethod
    def _unique(
        recommendations: list[str],
    ) -> list[str]:
        """
        Remove duplicate recommendations while preserving order.
        """

        return list(
            dict.fromkeys(
                recommendations,
            )
        )