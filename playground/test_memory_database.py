from core.persistence.memory_database import MemoryDatabase
from packages.contracts.skill import Skill

db = MemoryDatabase()

db.skills["SKILL-ADD-001"] = Skill(
    identifier="SKILL-ADD-001",
    name="Addition",
    description="",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

print(db.skills)