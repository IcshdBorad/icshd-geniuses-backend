from packages.contracts.framework import Framework
from packages.contracts.standard import Standard
from packages.contracts.learning_objective import LearningObjective
from packages.contracts.skill import Skill

from core.domains.knowledge.repository import KnowledgeRepository

repository = KnowledgeRepository()

framework = Framework(
    identifier="FW-ICSHD-MM",
    name="ICSHD Mental Math",
    description="Canonical framework",
)

standard = Standard(
    identifier="STD-MA",
    framework_id="FW-ICSHD-MM",
    name="Mental Arithmetic",
    description="Mental arithmetic standard",
)

objective = LearningObjective(
    identifier="OBJ-ADD-001",
    standard_id="STD-MA",
    name="Addition",
    description="Student can mentally add numbers",
)

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Add two one-digit numbers mentally",
    description="Basic addition",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

repository.add_framework(framework)
repository.add_standard(standard)
repository.add_learning_objective(objective)
repository.add_skill(skill)

print(repository.list_frameworks())
print(repository.list_standards())
print(repository.list_learning_objectives())
print(repository.list_skills())