from packages.contracts.skill import Skill
from packages.contracts.skill_status import SkillStatus


class RecommendationEngine:
    """
    Recommends the next skill.
    """

    def recommend(
        self,
        status: SkillStatus,
        current_skill: Skill,
        next_skill: Skill,
    ) -> Skill:

        if status.mastered:
            return next_skill

        return current_skill