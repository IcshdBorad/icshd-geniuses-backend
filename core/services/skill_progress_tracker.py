from __future__ import annotations

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.question import Question
from packages.contracts.skill_progress import SkillProgress

from core.domain.adaptive.forgetting_curve import ForgettingCurve



class SkillProgressTracker:
    """
    Skill Progress Tracker.

    Responsibilities
    ----------------
    - Retrieve or create skill progress.
    - Update learning statistics.
    - Update spaced repetition state.
    - Refresh forgetting probability.
    - Evaluate mastery.

    This service performs no persistence.
    """

    def __init__(
        self,
        forgetting_curve: ForgettingCurve | None = None,
    ) -> None:
        self._forgetting_curve = forgetting_curve

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def update(
        self,
        learner: Learner,
        question: Question,
        attempt: Attempt,
    ) -> SkillProgress:
        """
        Update learner progress for the answered skill.
        """

        progress = self._get_or_create_progress(
            learner=learner,
            skill_id=question.skill_id,
        )

        self._update_statistics(
            progress=progress,
            attempt=attempt,
        )

        self._update_review_state(
            progress=progress,
            attempt=attempt,
        )

        self._refresh_forgetting_probability(
            progress,
        )

        self._refresh_mastery(
            learner=learner,
            progress=progress,
        )

        return progress

    # ---------------------------------------------------------
    # Query API
    # ---------------------------------------------------------

    @staticmethod
    def get_progress(
        learner: Learner,
        skill_id: str,
    ) -> SkillProgress | None:
        """
        Return learner progress for a skill.
        """

        return learner.get_skill_progress(
            skill_id,
        )

    @staticmethod
    def has_progress(
        learner: Learner,
        skill_id: str,
    ) -> bool:
        """
        Return whether learner progress exists.
        """

        return (
            learner.get_skill_progress(
                skill_id,
            )
            is not None
        )

    @staticmethod
    def reset_skill(
        learner: Learner,
        skill_id: str,
    ) -> None:
        """
        Remove learner progress for a skill.
        """

        learner.skill_progress.pop(
            skill_id,
            None,
        )

        learner.mastered_skills.discard(
            skill_id,
        )

    # ---------------------------------------------------------
    # Progress
    # ---------------------------------------------------------

    @staticmethod
    def _get_or_create_progress(
        learner: Learner,
        skill_id: str,
    ) -> SkillProgress:
        """
        Retrieve existing progress or create a new one.
        """

        progress = learner.get_skill_progress(
            skill_id,
        )

        if progress is None:

            progress = SkillProgress(
                skill_id=skill_id,
            )

            learner.skill_progress[
                skill_id
            ] = progress

        return progress

    # ---------------------------------------------------------
    # Statistics
    # ---------------------------------------------------------

    @staticmethod
    def _update_statistics(
        progress: SkillProgress,
        attempt: Attempt,
    ) -> None:
        """
        Update learning statistics.
        """

        progress.register_attempt(
            is_correct=attempt.is_correct,
            duration_ms=attempt.duration_ms,
        )

    # ---------------------------------------------------------
    # Review State
    # ---------------------------------------------------------

    @staticmethod
    def _update_review_state(
        progress: SkillProgress,
        attempt: Attempt,
    ) -> None:
        """
        Update spaced repetition state.
        """

        progress.update_review(
            review_stage=attempt.review_stage,
            ease_factor=attempt.ease_factor,
            next_review=attempt.next_review,
            attempted_at=attempt.attempted_at,
        )

    # ---------------------------------------------------------
    # Forgetting Curve
    # ---------------------------------------------------------

    def _refresh_forgetting_probability(
        self,
        progress: SkillProgress,
    ) -> None:
        """
        Refresh forgetting probability.
        """

        if self._forgetting_curve is None:
            return

        progress.forgetting_probability = (
            self._forgetting_curve.forgetting_probability(
                progress,
            )
        )

    # ---------------------------------------------------------
    # Mastery
    # ---------------------------------------------------------

    @staticmethod
    def _refresh_mastery(
        learner: Learner,
        progress: SkillProgress,
    ) -> None:
        """
        Refresh mastery state.
        """

        progress.evaluate_mastery()

        if progress.mastered:
            learner.mark_skill_mastered(
                progress.skill_id,
            )