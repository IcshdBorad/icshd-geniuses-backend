from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta

from core.application.ports.clock import Clock

from packages.contracts.attempt import Attempt


class SpacedRepetition:
    """
    Stateless spaced repetition scheduling service.

    Responsibilities
    ----------------
    - Calculate review intervals.
    - Calculate next review timestamps.
    - Maintain ease factor.
    - Determine whether questions are due.
    - Return latest learner attempts.

    Notes
    -----
    This implementation is interval-based and can later be
    replaced by SM-2 or FSRS without changing callers.
    """

    REVIEW_INTERVALS: tuple[timedelta, ...] = (
        timedelta(minutes=10),
        timedelta(hours=1),
        timedelta(days=1),
        timedelta(days=3),
        timedelta(days=7),
        timedelta(days=14),
    )

    MAX_REVIEW_STAGE = len(REVIEW_INTERVALS) - 1

    INCORRECT_INTERVAL = timedelta(hours=12)

    DEFAULT_EASE_FACTOR = 2.5
    MIN_EASE_FACTOR = 1.3
    MAX_EASE_FACTOR = 3.0

    def __init__(
        self,
        clock: Clock,
    ) -> None:
        self._clock = clock

    # ---------------------------------------------------------
    # Review Interval
    # ---------------------------------------------------------

    def get_review_interval(
        self,
        review_stage: int,
    ) -> timedelta:
        """
        Return the interval associated with a review stage.
        """

        stage = max(
            0,
            min(
                review_stage,
                self.MAX_REVIEW_STAGE,
            ),
        )

        return self.REVIEW_INTERVALS[stage]

    # ---------------------------------------------------------
    # Next Review
    # ---------------------------------------------------------

    def calculate_next_review(
        self,
        attempted_at: datetime,
        review_stage: int,
        is_correct: bool,
    ) -> datetime:
        """
        Calculate the next review timestamp.
        """

        interval = (
            self.INCORRECT_INTERVAL
            if not is_correct
            else self.get_review_interval(
                review_stage,
            )
        )

        return attempted_at + interval

    # ---------------------------------------------------------
    # Ease Factor
    # ---------------------------------------------------------

    def calculate_ease_factor(
        self,
        previous_ease_factor: float,
        is_correct: bool,
    ) -> float:
        """
        Calculate the updated ease factor.
        """

        delta = 0.15 if is_correct else -0.20

        return round(
            max(
                self.MIN_EASE_FACTOR,
                min(
                    previous_ease_factor + delta,
                    self.MAX_EASE_FACTOR,
                ),
            ),
            2,
        )

    # ---------------------------------------------------------
    # Due Review
    # ---------------------------------------------------------

    def is_due(
        self,
        attempt: Attempt,
    ) -> bool:
        """
        Determine whether an attempt is due for review.
        """

        next_review = (
            attempt.next_review
            if attempt.next_review is not None
            else self.calculate_next_review(
                attempted_at=attempt.attempted_at,
                review_stage=attempt.review_stage,
                is_correct=attempt.is_correct,
            )
        )

        return next_review <= self._clock.now()

    # ---------------------------------------------------------
    # Latest Attempts
    # ---------------------------------------------------------

    @staticmethod
    def latest_attempts(
        attempts: Sequence[Attempt],
    ) -> list[Attempt]:
        """
        Return the latest attempt for each question.
        """

        latest: dict[str, Attempt] = {}

        for attempt in attempts:

            previous = latest.get(
                attempt.question_id,
            )

            if (
                previous is None
                or attempt.attempted_at > previous.attempted_at
            ):
                latest[
                    attempt.question_id
                ] = attempt

        return list(
            latest.values(),
        )

    # ---------------------------------------------------------
    # Due Attempts
    # ---------------------------------------------------------

    def due_attempts(
        self,
        attempts: Sequence[Attempt],
    ) -> list[Attempt]:
        """
        Return all latest attempts that are currently due.
        """

        latest = self.latest_attempts(
            attempts,
        )

        return [
            attempt
            for attempt in latest
            if self.is_due(
                attempt,
            )
        ]

    # ---------------------------------------------------------
    # Due Question IDs
    # ---------------------------------------------------------

    def due_question_ids(
        self,
        attempts: Sequence[Attempt],
    ) -> set[str]:
        """
        Return identifiers of all questions currently due.
        """

        return {
            attempt.question_id
            for attempt in self.due_attempts(
                attempts,
            )
        }

    # ---------------------------------------------------------
    # Single Question
    # ---------------------------------------------------------

    def is_question_due(
        self,
        question_id: str,
        attempts: Sequence[Attempt],
    ) -> bool:
        """
        Determine whether a specific question is due.
        """

        latest = {
            attempt.question_id: attempt
            for attempt in self.latest_attempts(
                attempts,
            )
        }

        attempt = latest.get(
            question_id,
        )

        if attempt is None:
            return False

        return self.is_due(
            attempt,
        )