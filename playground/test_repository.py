from packages.contracts.skill import Skill
from core.domains.knowledge.repository import KnowledgeRepository


repository = KnowledgeRepository()

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Add two one-digit numbers mentally",
    description="Basic mental addition",
    standard_id="STD-MATH-001",
    objective_id="OBJ-ADD-001",
)

repository.add_skill(skill)

found = repository.get_skill("SKILL-ADD-001")

print(found)

print()

print(repository.list_skills())