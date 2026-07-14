from packages.contracts.skill_status import SkillStatus


class ProgressionEngine:
    """
    Determines whether the learner may advance.
    """

    def can_progress(self, status: SkillStatus) -> bool:
        return status.mastered