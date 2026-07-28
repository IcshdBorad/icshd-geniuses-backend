from core.repositories.question_repository import QuestionRepository
from packages.contracts.question import Question


class SaveQuestionUseCase:
    """
    Saves a question.
    """

    def __init__(self, repository: QuestionRepository):
        self.repository = repository

    def execute(self, question: Question) -> None:
        self.repository.save(question)