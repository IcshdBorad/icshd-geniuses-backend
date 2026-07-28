from __future__ import annotations

from typing import Iterable

from packages.contracts.learner import Learner
from packages.contracts.skill import Skill

from core.services.skill_selector import (
    SkillSelector,
)


class RecommendNextSkill:
    """
    Adaptive next skill recommendation service.

    Responsibilities
    ----------------
    - Select the next suitable skill.
    - Respect learner progress.
    - Respect prerequisites.
    - Avoid mastered skills.
    - Delegate priority calculation.

    Does NOT
    --------
    - Update learner state.
    - Mark mastery.
    - Save repositories.
    - Select questions.
    """


    def __init__(
        self,
        skill_selector: SkillSelector,
    ) -> None:

        self.skill_selector = (
            skill_selector
        )


    # ---------------------------------------------------------
    # Recommend
    # ---------------------------------------------------------

    def recommend(
        self,
        learner: Learner,
        skills: Iterable[Skill],
        attempts: list | None = None,
    ) -> Skill | None:
        """
        Returns the next recommended skill.
        """


        if attempts is None:
            attempts = []


        available_skills = list(
            skills
        )


        if not available_skills:
            return None


        return (
            self.skill_selector.select_next_skill(
                learner=learner,
                skills=available_skills,
                attempts=attempts,
            )
        )


    # ---------------------------------------------------------
    # Availability
    # ---------------------------------------------------------

    def has_recommendation(
        self,
        learner: Learner,
        skills: Iterable[Skill],
    ) -> bool:
        """
        Checks whether learner has another skill.
        """


        return (
            self.recommend(
                learner=learner,
                skills=skills,
            )
            is not None
        )