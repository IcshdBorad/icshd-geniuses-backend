from core.domains.generation.template import QuestionTemplate
from core.domains.generation.generator import QuestionGenerator
from core.domains.generation.renderer import QuestionRenderer

template = QuestionTemplate(
    identifier="TPL-ADD-001",
    skill_id="SKILL-ADD-001",
    name="Simple Addition",
    template="3 + 5 = ?",
    difficulty=1,
)

generator = QuestionGenerator()

renderer = QuestionRenderer()

question = generator.generate(template)

print(question)

print()

print(renderer.render(question))