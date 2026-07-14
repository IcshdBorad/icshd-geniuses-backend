from packages.contracts.skill_status import SkillStatus


class DifficultyStrategy:
    """
    Determines the next difficulty level.
    """

    def next_difficulty(self, status: SkillStatus) -> int:
        if status.mastered:
            return 2

        return 1