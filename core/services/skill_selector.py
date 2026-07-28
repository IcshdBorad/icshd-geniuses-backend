from __future__ import annotations

from collections.abc import Sequence

from packages.contracts.learner import Learner
from packages.contracts.skill import Skill
from packages.contracts.skill_progress import SkillProgress

from core.domain.adaptive.forgetting_curve import ForgettingCurve
from core.services.learning_path import LearningPath
from core.services.skill_priority import SkillPriority


class SkillSelector:
    """
    Adaptive Skill Selection Service.

    Responsibilities
    ----------------
    - Filter inactive skills.
    - Enforce prerequisite completion.
    - Ignore mastered skills.
    - Rank candidate skills.
    - Return the highest-priority skill.
    """

    def __init__(
        self,
        skill_priority: SkillPriority,
        learning_path: LearningPath,
        forgetting_curve: ForgettingCurve,
    ) -> None:
        self._skill_priority = skill_priority
        self._learning_path = learning_path
        self._forgetting_curve = forgetting_curve

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def select_next_skill(
        self,
        *,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> Skill | None:
        """
        Select the highest-priority available skill.
        """

        candidates = self._candidate_skills(
            learner=learner,
            skills=skills,
        )

        if not candidates:
            return None

        progress = self._progress_lookup(
            learner=learner,
            skills=candidates,
        )

        return self._skill_priority.highest_priority(
            learner=learner,
            skills=candidates,
            progress=progress,
        )

    def has_available_skill(
        self,
        *,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> bool:
        return (
            self.select_next_skill(
                learner=learner,
                skills=skills,
            )
            is not None
        )

    # ---------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------

    def _candidate_skills(
        self,
        *,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> list[Skill]:

        candidates: list[Skill] = []

        for skill in skills:

            if not skill.is_active:
                continue

            if not self._learning_path.prerequisites_completed(
                learner,
                skill,
            ):
                continue

            progress = learner.get_skill_progress(
                skill.identifier,
            )

            if progress is not None and progress.mastered:
                continue

            candidates.append(skill)

        return candidates

    def _progress_lookup(
        self,
        *,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> dict[str, SkillProgress]:

        result: dict[str, SkillProgress] = {}

        for skill in skills:

            progress = learner.get_skill_progress(
                skill.identifier,
            )

            if progress is not None:
                result[skill.identifier] = progress

        return result