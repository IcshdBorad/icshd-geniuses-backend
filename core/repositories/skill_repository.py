from core.persistence.memory_database import MemoryDatabase
from packages.contracts.skill import Skill


class SkillRepository:

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def add(self, skill: Skill):
        self.database.skills[skill.identifier] = skill

    def by_id(self, identifier: str):
        return self.database.skills.get(identifier)

    def all(self):
        return list(self.database.skills.values())