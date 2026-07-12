from packages.contracts.skill import Skill
from core.domains.knowledge.repository import KnowledgeRepository
from core.domains.knowledge.service import KnowledgeService


repository = KnowledgeRepository()
service = KnowledgeService(repository)

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Add two one-digit numbers mentally",
    description="Basic mental addition",
    standard_id="STD-MATH-001",
    objective_id="OBJ-ADD-001",
)

service.register_skill(skill)

print(service.find_skill("SKILL-ADD-001"))

print()

print(service.list_skills())