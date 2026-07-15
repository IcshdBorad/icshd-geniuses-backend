from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_skill_repository import MemorySkillRepository
from packages.contracts.skill import Skill


db = MemoryDatabase()

repo = MemorySkillRepository(db)

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Addition",
    description="",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

repo.save(skill)

print(repo.get("SKILL-ADD-001"))
print(repo.list())