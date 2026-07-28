from packages.contracts.question import Question


class QuestionRenderer:
    """
    Renders questions for display.
    """

    def render(self, question: Question) -> str:
        return question.prompt