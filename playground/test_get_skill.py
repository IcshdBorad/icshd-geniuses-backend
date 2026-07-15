from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_skill_repository import MemorySkillRepository
from core.use_cases.get_skill import GetSkillUseCase

from packages.contracts.skill import Skill


db = MemoryDatabase()

repository = MemorySkillRepository(db)

repository.save(
    Skill(
        identifier="SKILL-ADD-001",
        name="Addition",
        description="",
        standard_id="STD-MA",
        objective_id="OBJ-ADD-001",
    )
)

use_case = GetSkillUseCase(repository)

print(use_case.execute("SKILL-ADD-001"))