from core.services.generation_service import GenerationService
from core.domains.generation.template import QuestionTemplate

service = GenerationService()

template = QuestionTemplate(
    identifier="TMP-001",
    skill_id="SKILL-ADD-001",
    name="Simple Addition",
    template="3 + 5 = ?",
)

question = service.generate(template)

print(question)
print(service.all_questions())