from __future__ import annotations

from collections.abc import Sequence

from packages.contracts.attempt import Attempt
from packages.contracts.performance import Performance


class PerformanceAnalyzer:
    """
    Learner Performance Analysis Service.

    Responsibilities
    ----------------
    - Analyze learner attempts.
    - Calculate learning accuracy.
    - Calculate average score.
    - Calculate average response duration.
    - Calculate current success streak.
    - Calculate best success streak.
    - Produce a Performance snapshot.

    This service is completely stateless.
    """

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def analyze(
        self,
        attempts: Sequence[Attempt],
    ) -> Performance:
        """
        Analyze learner attempts.

        Parameters
        ----------
        attempts:
            Learner attempts.

        Returns
        -------
        Performance
            Aggregated learner performance.
        """

        if not attempts:
            return Performance.empty()

        ordered_attempts = sorted(
            attempts,
            key=lambda attempt: attempt.attempted_at,
        )

        total_attempts = len(
            ordered_attempts,
        )

        correct_attempts = sum(
            attempt.is_correct
            for attempt in ordered_attempts
        )

        incorrect_attempts = (
            total_attempts
            - correct_attempts
        )

        return Performance(

            total_attempts=total_attempts,

            correct_attempts=correct_attempts,

            incorrect_attempts=incorrect_attempts,

            accuracy=self._accuracy(
                correct_attempts=correct_attempts,
                total_attempts=total_attempts,
            ),

            average_score=self._average_score(
                ordered_attempts,
            ),

            average_duration_ms=self._average_duration(
                ordered_attempts,
            ),

            current_streak=self._current_streak(
                ordered_attempts,
            ),

            best_streak=self._best_streak(
                ordered_attempts,
            ),

            last_correct=ordered_attempts[
                -1
            ].is_correct,
        )

    # ---------------------------------------------------------
    # Metrics
    # ---------------------------------------------------------

    @staticmethod
    def _accuracy(
        *,
        correct_attempts: int,
        total_attempts: int,
    ) -> float:
        """
        Calculate learner accuracy.
        """

        return correct_attempts / total_attempts

    @staticmethod
    def _average_score(
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Calculate average learner score.
        """

        return sum(
            attempt.score
            for attempt in attempts
        ) / len(attempts)

    @staticmethod
    def _average_duration(
        attempts: Sequence[Attempt],
    ) -> float:
        """
        Calculate average response duration.
        """

        return sum(
            attempt.duration_ms
            for attempt in attempts
        ) / len(attempts)

    # ---------------------------------------------------------
    # Current Streak
    # ---------------------------------------------------------

    @staticmethod
    def _current_streak(
        attempts: Sequence[Attempt],
    ) -> int:
        """
        Calculate the learner's current
        consecutive correct-answer streak.
        """

        streak = 0

        for attempt in reversed(
            attempts,
        ):

            if not attempt.is_correct:
                break

            streak += 1

        return streak

    # ---------------------------------------------------------
    # Best Streak
    # ---------------------------------------------------------

    @staticmethod
    def _best_streak(
        attempts: Sequence[Attempt],
    ) -> int:
        """
        Calculate the learner's best
        consecutive correct-answer streak.
        """

        streak = 0
        best = 0

        for attempt in attempts:

            if attempt.is_correct:

                streak += 1

                if streak > best:
                    best = streak

            else:

                streak = 0

        return best