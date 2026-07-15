from core.services.generation_service import GenerationService
from packages.contracts.question import Question


service = GenerationService()

service.save_question(
    Question(
        identifier="Q-001",
        skill_id="SKILL-ADD-001",
        prompt="3 + 5 = ?",
        answer="8",
        difficulty=1,
        question_type="short_answer",
    )
)

print(service.get_question("Q-001"))
print(service.list_questions())