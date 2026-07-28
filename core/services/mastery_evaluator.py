from __future__ import annotations

from packages.contracts.competency import Competency
from packages.contracts.mastery import Mastery
from packages.contracts.performance import Performance


class MasteryEvaluator:
    """
    Learner Mastery Evaluation Service.

    Responsibilities
    ----------------
    - Evaluate learner mastery from performance and competency.
    - Determine the learner mastery level.
    - Estimate learner confidence.
    - Produce a normalized Mastery snapshot.

    This service is stateless.
    """

    MASTERED_ACCURACY = 0.90
    PROFICIENT_ACCURACY = 0.75
    LEARNING_ACCURACY = 0.50

    MASTERED_COMPETENCY = 85.0
    PROFICIENT_COMPETENCY = 65.0

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def evaluate(
        self,
        performance: Performance,
        competency: Competency,
    ) -> Mastery:
        """
        Evaluate the learner mastery state.

        Parameters
        ----------
        performance:
            Current learner performance snapshot.

        competency:
            Current learner competency snapshot.

        Returns
        -------
        Mastery
            Normalized learner mastery information.
        """

        return Mastery(
            level=self._mastery_level(
                accuracy=performance.accuracy,
                competency_score=competency.overall_competency,
            ),
            accuracy=round(
                performance.accuracy * 100,
                2,
            ),
            average_duration_ms=round(
                performance.average_duration_ms,
                2,
            ),
            competency_score=round(
                competency.overall_competency,
                2,
            ),
            confidence=self._confidence(
                performance=performance,
                competency=competency,
            ),
        )

    # ---------------------------------------------------------
    # Mastery Level
    # ---------------------------------------------------------

    def _mastery_level(
        self,
        *,
        accuracy: float,
        competency_score: float,
    ) -> str:
        """
        Determine the learner mastery level.
        """

        if (
            accuracy >= self.MASTERED_ACCURACY
            and competency_score >= self.MASTERED_COMPETENCY
        ):
            return "MASTERED"

        if (
            accuracy >= self.PROFICIENT_ACCURACY
            and competency_score >= self.PROFICIENT_COMPETENCY
        ):
            return "PROFICIENT"

        if accuracy >= self.LEARNING_ACCURACY:
            return "LEARNING"

        return "BEGINNER"

    # ---------------------------------------------------------
    # Confidence
    # ---------------------------------------------------------

    @staticmethod
    def _confidence(
        *,
        performance: Performance,
        competency: Competency,
    ) -> float:
        """
        Estimate learner confidence.

        Confidence is computed as the average of:

        - Accuracy percentage.
        - Overall competency.

        Returns
        -------
        float
            Confidence percentage in the range [0, 100].
        """

        confidence = (
            performance.accuracy * 100
            + competency.overall_competency
        ) / 2

        return round(
            min(
                confidence,
                100.0,
            ),
            2,
        )