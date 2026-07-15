from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_skill_repository import MemorySkillRepository
from core.use_cases.save_skill import SaveSkillUseCase

from packages.contracts.skill import Skill


db = MemoryDatabase()

repository = MemorySkillRepository(db)

use_case = SaveSkillUseCase(repository)

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Addition",
    description="",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

use_case.execute(skill)

print(repository.get("SKILL-ADD-001"))