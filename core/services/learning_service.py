from core.persistence.memory_database import MemoryDatabase

from core.repositories.memory_skill_repository import MemorySkillRepository

from core.use_cases.get_skill import GetSkillUseCase
from core.use_cases.save_skill import SaveSkillUseCase

from packages.contracts.skill import Skill


class LearningService:
    """
    Application service for learning operations.
    """

    def __init__(self):
        self.database = MemoryDatabase()

        repository = MemorySkillRepository(self.database)

        self.get_skill = GetSkillUseCase(repository)
        self.save_skill = SaveSkillUseCase(repository)

    def add_skill(self, skill: Skill) -> None:
        self.save_skill.execute(skill)

    def get(self, identifier: str) -> Skill | None:
        return self.get_skill.execute(identifier)