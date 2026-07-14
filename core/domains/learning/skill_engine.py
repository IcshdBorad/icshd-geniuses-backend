from packages.contracts.skill_status import SkillStatus


class SkillEngine:
    """
    Determines whether a learner has mastered a skill.
    """

    def has_mastered(self, status: SkillStatus) -> bool:
        return status.mastered