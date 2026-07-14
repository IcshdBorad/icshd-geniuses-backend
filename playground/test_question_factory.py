from core.domains.generation.question_factory import QuestionFactory
from core.domains.generation.template import QuestionTemplate

template = QuestionTemplate(
    identifier="TMP-001",
    skill_id="SKILL-ADD-001",
    name="Addition",
    template="{a} + {b} = ?",
)

factory = QuestionFactory()

question = factory.create(
    template,
    {"a": 3, "b": 5},
    "8",
)

print(question)