from packages.contracts.question import Question
from core.domains.generation.template import QuestionTemplate


class QuestionFactory:
    """
    Creates Question objects from templates and generated variables.
    """

    def create(
        self,
        template: QuestionTemplate,
        variables: dict,
        answer: str,
    ) -> Question:

        prompt = template.render(**variables)

        return Question(
            identifier="Q-001",
            skill_id=template.skill_id,
            prompt=prompt,
            answer=answer,
            difficulty=template.difficulty,
            question_type="short_answer",
        )