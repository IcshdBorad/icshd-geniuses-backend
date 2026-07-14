from packages.contracts.skill import Skill
from packages.contracts.skill_status import SkillStatus

from core.domains.adaptive.difficulty_strategy import DifficultyStrategy
from core.domains.adaptive.skill_selector import SkillSelector


class AdaptiveEngine:
    """
    Coordinates adaptive learning decisions.
    """

    def decide(
        self,
        status: SkillStatus,
        current: Skill,
        next_skill: Skill,
    ):

        difficulty = DifficultyStrategy().next_difficulty(status)

        skill = SkillSelector().select(
            status,
            current,
            next_skill,
        )

        return difficulty, skill