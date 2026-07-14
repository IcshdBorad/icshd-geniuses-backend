from core.domains.generation.validator import QuestionValidator
from packages.contracts.question import Question


question = Question(
    identifier="Q-001",
    skill_id="SKILL-ADD-001",
    prompt="3 + 5 = ?",
    answer="8",
    difficulty=1,
    question_type="short_answer",
)

validator = QuestionValidator()

print(validator.validate(question))