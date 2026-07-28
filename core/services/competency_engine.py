from __future__ import annotations

from collections.abc import Sequence

from packages.contracts.attempt import Attempt
from packages.contracts.competency import Competency


class CompetencyEngine:
    """
    Learner Competency Evaluation Service.

    Responsibilities
    ----------------
    - Evaluate learner knowledge.
    - Evaluate response speed.
    - Evaluate answer consistency.
    - Evaluate long-term retention.
    - Estimate learner confidence.
    - Produce an overall competency score.

    All scores are normalized to the range [0, 100].

    This service is stateless.
    """

    KNOWLEDGE_WEIGHT = 0.35
    SPEED_WEIGHT = 0.15
    STABILITY_WEIGHT = 0.20
    RETENTION_WEIGHT = 0.20
    CONFIDENCE_WEIGHT = 0.10

    MAX_SCORE = 100.0

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def evaluate(
        self,
        attempts: Sequence[Attempt],
    ) -> Competency:
        """
        Evaluate learner competency.

        Parameters
        ----------
        attempts:
            Learner attempts.

        Returns
        -------
        Competency
            Evaluated learner competency snapshot.
        """

        if not attempts:
            return Competency()

        knowledge = self._knowledge(
            attempts,
        )

        speed = self._speed(
            attempts,
        )

        stability = self._stability(
            attempts,
        )

        retention = self._retention(
            attempts,
        )

        confidence = self._confidence(
            attempts,
        )

        overall = self._overall_score(
            knowledge=knowledge,
            speed=speed,
            stability=stability,
            retention=retention,
            confidence=confidence,
        )

        return Competency(

            knowledge=round(
                knowledge,
                2,
            ),

            speed=round(
                speed,
                2,
            ),

            stability=round(
                stability,
                2,
            ),

            retention=round(
                retention,
                2,
            ),

            confidence=round(
                confidence,
                2,
            ),

            overall_competency=round(
                overall,
                2,
            ),
        )

    # ---------------------------------------------------------
    # Overall Score
    # ---------------------------------------------------------

    def _overall_score(
        self,
        *,
        knowledge: float,
        speed: float,
        stability: float,
        retention: float,
        confidence: float,
    ) -> float:
        """
        Calculate the weighted competency score.
        """

        return (

            knowledge * self.KNOWLEDGE_WEIGHT

            + speed * self.SPEED_WEIGHT

            + stability * self.STABILITY_WEIGHT

            + retention * self.RETENTION_WEIGHT

            + confidence * self.CONFIDENCE_WEIGHT

        )

    # ---------------------------------------------------------
    # Knowledge
    # ---------------------------------------------------------

    @staticmethod
    def _knowledge(
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Evaluate learner knowledge from accuracy.
        """

        correct_answers = sum(
            attempt.is_correct
            for attempt in attempts
        )

        return (
            correct_answers
            / len(attempts)
        ) * 100

    # ---------------------------------------------------------
    # Speed
    # ---------------------------------------------------------

    def _speed(
        self,
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Evaluate learner response speed.
        """

        average_duration = (

            sum(
                attempt.duration_ms
                for attempt in attempts
            )

            / len(attempts)

        )

        score = (
            self.MAX_SCORE
            - average_duration / 150
        )

        return max(
            0.0,
            min(
                score,
                self.MAX_SCORE,
            ),
        )

    # ---------------------------------------------------------
    # Stability
    # ---------------------------------------------------------

    @staticmethod
    def _stability(
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Evaluate answer consistency.
        """

        if len(attempts) < 2:
            return 50.0

        transitions = sum(

            previous.is_correct
            != current.is_correct

            for previous, current in zip(
                attempts,
                attempts[1:],
            )

        )

        return (

            1
            - transitions
            / (len(attempts) - 1)

        ) * 100

    # ---------------------------------------------------------
    # Retention
    # ---------------------------------------------------------

    @staticmethod
    def _retention(
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Evaluate long-term retention.
        """

        retained_answers = sum(

            attempt.is_correct
            and attempt.review_stage > 0

            for attempt in attempts

        )

        return (

            retained_answers
            / len(attempts)

        ) * 100

    # ---------------------------------------------------------
    # Confidence
    # ---------------------------------------------------------

    def _confidence(
        self,
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Estimate learner confidence.

        Confidence gradually increases as the learner
        accumulates more attempts.
        """

        return min(
            float(
                len(attempts),
            ),
            self.MAX_SCORE,
        )

    # ---------------------------------------------------------
    # Level
    # ---------------------------------------------------------

    @staticmethod
    def level(
        competency: Competency,
    ) -> str:
        """
        Return the competency level.
        """

        score = competency.overall_competency

        if score >= 90:
            return "MASTERED"

        if score >= 75:
            return "PROFICIENT"

        if score >= 50:
            return "LEARNING"

        return "BEGINNER"