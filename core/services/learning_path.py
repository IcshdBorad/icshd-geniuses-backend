from __future__ import annotations

from collections.abc import Sequence

from packages.contracts.learner import Learner
from packages.contracts.skill import Skill


class LearningPath:
    """
    Learning Path Service.

    Responsibilities
    ----------------
    - Verify prerequisite completion.
    - Determine available skills.
    - Determine the next available skill.
    - Check mastery state.
    - Determine whether a skill is locked.

    This service is stateless.
    """

    # ---------------------------------------------------------
    # Prerequisites
    # ---------------------------------------------------------

    def prerequisites_completed(
        self,
        learner: Learner,
        skill: Skill,
    ) -> bool:
        """
        Return True when all prerequisite skills
        have already been mastered.
        """

        return all(
            self.mastered(
                learner,
                prerequisite_id,
            )
            for prerequisite_id in skill.prerequisites
        )

    # ---------------------------------------------------------
    # Available Skills
    # ---------------------------------------------------------

    def available_skills(
        self,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> list[Skill]:
        """
        Return every skill currently available
        to the learner.
        """

        return [
            skill
            for skill in skills
            if (
                skill.is_active
                and self.prerequisites_completed(
                    learner,
                    skill,
                )
            )
        ]

    # ---------------------------------------------------------
    # Next Skill
    # ---------------------------------------------------------

    def next_skill(
        self,
        learner: Learner,
        skills: Sequence[Skill],
    ) -> Skill | None:
        """
        Return the first available skill that
        has not yet been mastered.
        """

        for skill in self.available_skills(
            learner,
            skills,
        ):

            if not self.mastered(
                learner,
                skill.identifier,
            ):
                return skill

        return None

    # ---------------------------------------------------------
    # Mastery
    # ---------------------------------------------------------

    @staticmethod
    def mastered(
        learner: Learner,
        skill_id: str,
    ) -> bool:
        """
        Return whether the learner has mastered
        the specified skill.
        """

        progress = learner.get_skill_progress(
            skill_id,
        )

        return (
            progress is not None
            and progress.mastered
        )

    # ---------------------------------------------------------
    # Locked
    # ---------------------------------------------------------

    def locked(
        self,
        learner: Learner,
        skill: Skill,
    ) -> bool:
        """
        Return whether the skill is locked.
        """

        return not self.prerequisites_completed(
            learner,
            skill,
        )