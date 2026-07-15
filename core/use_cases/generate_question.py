from core.domains.generation.question_factory import QuestionFactory
from core.domains.generation.variable_generator import VariableGenerator
from core.domains.generation.template import QuestionTemplate


class GenerateQuestionUseCase:
    """
    Generates a question from a template.
    """

    def __init__(
        self,
        generator: VariableGenerator,
        factory: QuestionFactory,
    ):
        self.generator = generator
        self.factory = factory

    def execute(
        self,
        template: QuestionTemplate,
        answer: str,
    ):
        variables = self.generator.generate()

        return self.factory.create(
            template,
            variables,
            answer,
        )