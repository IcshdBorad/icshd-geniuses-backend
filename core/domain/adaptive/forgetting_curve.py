
from __future__ import annotations

import math
from datetime import datetime, timedelta

from core.application.ports.clock import Clock

from packages.contracts.skill_progress import (
    SkillProgress,
)


class ForgettingCurve:
    """
    Forgetting Curve Engine.

    Estimates learner memory retention using an
    exponential forgetting model.

    Responsibilities
    ----------------
    - Estimate memory retention.
    - Estimate forgetting probability.
    - Determine review necessity.
    - Calculate review priority.

    This service is stateless and fully testable.
    """

    FORGETTING_WEIGHT = 0.50
    STABILITY_WEIGHT = 0.25
    ACCURACY_WEIGHT = 0.25

    SECONDS_PER_DAY = 86_400

    def __init__(
        self,
        clock: Clock,
    ) -> None:
        self._clock = clock

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def retention(
        self,
        progress: SkillProgress,
        now: datetime | None = None,
    ) -> float:
        """
        Estimate current memory retention.
        """

        if progress.last_review is None:
            return 0.0

        current_time = now or self._clock.now()

        elapsed_days = self._elapsed_days(
            progress.last_review,
            current_time,
        )

        if elapsed_days <= 0:
            return 1.0

        stability = self._estimate_stability(
            progress,
        )

        retention = math.exp(
            -elapsed_days / stability
        )

        return max(
            0.0,
            min(retention, 1.0),
        )

    def forgetting_probability(
        self,
        progress: SkillProgress,
        now: datetime | None = None,
    ) -> float:
        """
        Estimate forgetting probability.
        """

        return (
            1.0
            - self.retention(
                progress,
                now,
            )
        )

    def needs_review(
        self,
        progress: SkillProgress,
        threshold: float = 0.70,
        now: datetime | None = None,
    ) -> bool:
        """
        Determine whether the learner
        should review the skill.
        """

        return (
            self.retention(
                progress,
                now,
            )
            < threshold
        )

    def review_priority(
        self,
        progress: SkillProgress,
        now: datetime | None = None,
    ) -> float:
        """
        Calculate adaptive review priority.
        """

        forgetting_score = (
            self.forgetting_probability(
                progress,
                now,
            )
        )

        stability_score = (
            1.0
            / self._estimate_stability(
                progress,
            )
        )

        accuracy_score = (
            1.0
            - progress.accuracy / 100.0
        )

        priority = (

            forgetting_score
            * self.FORGETTING_WEIGHT

            + stability_score
            * self.STABILITY_WEIGHT

            + accuracy_score
            * self.ACCURACY_WEIGHT

        )

        return round(
            priority,
            4,
        )

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    @classmethod
    def _elapsed_days(
        cls,
        start: datetime,
        end: datetime,
    ) -> float:
        """
        Calculate elapsed days.
        """

        delta: timedelta = end - start

        return (
            delta.total_seconds()
            / cls.SECONDS_PER_DAY
        )

    @staticmethod
    def _estimate_stability(
        progress: SkillProgress,
    ) -> float:
        """
        Estimate learner memory stability.
        """

        stability = 1.0

        if progress.mastered:
            stability += 10.0

        stability += (
            progress.accuracy
            / 100
        ) * 5

        stability += (
            progress.attempts
            * 0.5
        )

        stability += (
            progress.review_stage
            * 2
        )

        stability *= max(
            progress.ease_factor,
            1.0,
        )

        return max(
            stability,
            1.0,
        )
