from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_skill_repository import MemorySkillRepository
from packages.contracts.skill import Skill


class LearningService:
    """
    Application service for learning.
    """

    def __init__(self):
        self.database = MemoryDatabase()
        self.skills = MemorySkillRepository(self.database)

    def save_skill(self, skill: Skill):
        self.skills.save(skill)

    def get_skill(self, identifier: str):
        return self.skills.get(identifier)

    def list_skills(self):
        return self.skills.list()