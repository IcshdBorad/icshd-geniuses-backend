from core.services.learning_service import LearningService

from packages.contracts.skill import Skill


service = LearningService()

service.add_skill(
    Skill(
        identifier="SKILL-ADD-001",
        name="Addition",
        description="",
        standard_id="STD-MA",
        objective_id="OBJ-ADD-001",
    )
)

print(service.get("SKILL-ADD-001"))