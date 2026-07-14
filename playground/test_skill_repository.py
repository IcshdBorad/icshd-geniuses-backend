from core.repositories.skill_repository import SkillRepository
from packages.contracts.skill import Skill

repo = SkillRepository()

repo.add(
    Skill(
        identifier="SKILL-ADD-001",
        name="Addition",
        description="",
        standard_id="STD-MA",
        objective_id="OBJ-ADD-001",
    )
)

print(repo.by_id("SKILL-ADD-001"))
print(repo.all())