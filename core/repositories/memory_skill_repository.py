from core.repositories.skill_repository import SkillRepository
from core.persistence.memory_database import MemoryDatabase
from packages.contracts.skill import Skill


class MemorySkillRepository(SkillRepository):
    """
    In-memory implementation of SkillRepository.
    """

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def get(self, identifier: str) -> Skill | None:
        return self.database.skills.get(identifier)

    def save(self, skill: Skill) -> None:
        self.database.skills[skill.identifier] = skill

    def list(self) -> list[Skill]:
        return list(self.database.skills.values())