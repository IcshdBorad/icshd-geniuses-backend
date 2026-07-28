from __future__ import annotations

from typing import Any
from collections.abc import Sequence

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.question import Question
from packages.contracts.skill import Skill


class QuestionSelector:
    """
    Adaptive Question Selection Service.

    Responsibilities
    ----------------
    - Filter questions belonging to the selected skill.
    - Ignore questions already answered correctly during
      the current learning history.
    - Return the first suitable question.

    This service is stateless.

    It never:
    ----------
    - Persists repositories.
    - Updates learner progress.
    - Evaluates answers.
    """

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def select_next_question(
        self,
        *,
        learner: Learner,
        skill: Skill,
        questions: Sequence[Question],
        attempts: Sequence[Attempt],
        session: Any = None,
    ) -> Question | None:
        """
        Select the next adaptive question for a skill.
        
        Accepts optional `session` context passed from NextQuestionPipeline.
        """
        candidates = self._candidate_questions(
            skill=skill,
            questions=questions,
        )

        if not candidates:
            return None

        answered_correctly = self._correct_question_ids(attempts)

        for question in candidates:
            if question.identifier not in answered_correctly:
                return question

        return None

    # ---------------------------------------------------------
    # Candidate Filtering
    # ---------------------------------------------------------

    def _candidate_questions(
        self,
        *,
        skill: Skill,
        questions: Sequence[Question],
    ) -> list[Question]:
        """
        Return questions belonging to the selected skill.
        """
        return [
            question
            for question in questions
            if question.skill_id == skill.identifier
        ]

    # ---------------------------------------------------------
    # Attempts
    # ---------------------------------------------------------

    def _correct_question_ids(
        self,
        attempts: Sequence[Attempt],
    ) -> set[str]:
        """
        Return question ids answered correctly.
        """
        return {
            attempt.question_id
            for attempt in attempts
            if attempt.is_correct
        }