from core.services.learning_service import LearningService
from packages.contracts.skill import Skill


service = LearningService()

service.save_skill(
    Skill(
        identifier="SKILL-ADD-001",
        name="Addition",
        description="",
        standard_id="STD-MA",
        objective_id="OBJ-ADD-001",
    )
)

print(service.get_skill("SKILL-ADD-001"))