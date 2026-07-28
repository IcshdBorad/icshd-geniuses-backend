from packages.contracts.question import Question
from core.domains.generation.template import QuestionTemplate


class QuestionGenerator:
    """
    Generates questions from templates.
    """

    def generate(self, template: QuestionTemplate) -> Question:
        return Question(
    identifier="Q-001",
    skill_id=template.skill_id,
    prompt=template.render(),
    answer="5",
    difficulty=template.difficulty,
    question_type="short_answer",
)