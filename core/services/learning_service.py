from core.persistence.memory_database import MemoryDatabase
from core.repositories.skill_repository import SkillRepository
from packages.contracts.skill import Skill


class LearningService:

    def __init__(self):
        self.database = MemoryDatabase()
        self.skills = SkillRepository(self.database)

    def register_skill(self, skill: Skill):
        self.skills.add(skill)

    def get_skill(self, identifier: str):
        return self.skills.by_id(identifier)