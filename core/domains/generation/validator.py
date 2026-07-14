from packages.contracts.question import Question


class QuestionValidator:
    """
    Validates generated questions.
    """

    def validate(self, question: Question) -> bool:
        if not question.prompt.strip():
            return False

        if not question.answer.strip():
            return False

        if question.difficulty < 1:
            return False

        return True