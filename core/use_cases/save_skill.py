from core.repositories.skill_repository import SkillRepository
from packages.contracts.skill import Skill


class SaveSkillUseCase:
    """
    Saves a skill.
    """

    def __init__(self, repository: SkillRepository):
        self.repository = repository

    def execute(self, skill: Skill) -> None:
        self.repository.save(skill)