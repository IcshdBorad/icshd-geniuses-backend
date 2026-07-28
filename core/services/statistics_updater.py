from __future__ import annotations

from packages.contracts.learner import Learner
from packages.contracts.attempt import Attempt


class StatisticsUpdater:
    """
    Updates learner statistics after an attempt.

    Responsibilities
    ----------------
    - Update total attempts.
    - Update correct answers.
    - Update total score.
    - Update accuracy-related counters.

    Does NOT
    --------
    - Create attempts.
    - Save repositories.
    - Evaluate mastery.
    - Select questions.
    """


    # ---------------------------------------------------------
    # Update
    # ---------------------------------------------------------

    def update(
        self,
        learner: Learner,
        attempt: Attempt,
    ) -> Learner:
        """
        Applies attempt result to learner statistics.
        """


        learner.register_attempt(
            is_correct=attempt.is_correct,
            score=attempt.score,
        )


        self._update_totals(
            learner,
            attempt,
        )


        return learner


    # ---------------------------------------------------------
    # Totals
    # ---------------------------------------------------------

    def _update_totals(
        self,
        learner: Learner,
        attempt: Attempt,
    ) -> None:
        """
        Updates additional statistics.
        """


        if not hasattr(
            learner,
            "total_attempts",
        ):
            learner.total_attempts = 0


        if not hasattr(
            learner,
            "total_correct",
        ):
            learner.total_correct = 0


        if not hasattr(
            learner,
            "total_score",
        ):
            learner.total_score = 0.0


        learner.total_attempts += 1


        if attempt.is_correct:

            learner.total_correct += 1


        learner.total_score += (
            attempt.score
        )


    # ---------------------------------------------------------
    # Accuracy
    # ---------------------------------------------------------

    def accuracy(
        self,
        learner: Learner,
    ) -> float:
        """
        Returns learner accuracy percentage.
        """


        if learner.total_attempts == 0:
            return 0.0


        return (
            learner.total_correct
            /
            learner.total_attempts
        ) * 100