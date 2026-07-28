from __future__ import annotations

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.question import Question
from packages.contracts.skill_progress import (
    SkillProgress,
)

from core.services.skill_progress_tracker import (
    SkillProgressTracker,
)


class LearnerProgressUpdater:
    """
    Learner Progress Updater.

    Responsibilities
    ----------------
    - Update learner statistics.
    - Update session statistics.
    - Update skill progress.
    - Return the updated SkillProgress.

    This service mutates domain objects only.
    It performs no persistence.
    """

    def __init__(
        self,
        skill_progress_tracker: SkillProgressTracker,
    ) -> None:
        self._skill_progress_tracker = (
            skill_progress_tracker
        )

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def update(
        self,
        learner: Learner,
        session: LearningSession,
        question: Question,
        attempt: Attempt,
    ) -> SkillProgress:
        """
        Apply all domain updates after a completed attempt.
        """

        self._update_learner(
            learner=learner,
            attempt=attempt,
        )

        self._update_session(
            session=session,
            attempt=attempt,
        )

        return self._update_skill_progress(
            learner=learner,
            question=question,
            attempt=attempt,
        )

    # ---------------------------------------------------------
    # Learner
    # ---------------------------------------------------------

    @staticmethod
    def _update_learner(
        learner: Learner,
        attempt: Attempt,
    ) -> None:
        """
        Update learner aggregate statistics.
        """

        learner.register_attempt(
            is_correct=attempt.is_correct,
            score=attempt.score,
        )

    # ---------------------------------------------------------
    # Session
    # ---------------------------------------------------------

    @staticmethod
    def _update_session(
        session: LearningSession,
        attempt: Attempt,
    ) -> None:
        """
        Update session aggregate statistics.
        """

        session.answered_questions += 1
        session.total_score += attempt.score

    # ---------------------------------------------------------
    # Skill Progress
    # ---------------------------------------------------------

    def _update_skill_progress(
        self,
        learner: Learner,
        question: Question,
        attempt: Attempt,
    ) -> SkillProgress:
        """
        Update learner progress for the current skill.
        """

        return self._skill_progress_tracker.update(
            learner=learner,
            question=question,
            attempt=attempt,
        )