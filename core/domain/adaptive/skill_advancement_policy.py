from packages.contracts.skill import Skill
from packages.contracts.skill_status import SkillStatus


class SkillSelector:
    """
    Selects the next skill.
    """

    def select(
        self,
        status: SkillStatus,
        current: Skill,
        next_skill: Skill,
    ) -> Skill:

        if status.mastered:
            return next_skill

        return current