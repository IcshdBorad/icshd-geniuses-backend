from core.repositories.question_repository import QuestionRepository
from packages.contracts.question import Question


class GetQuestionUseCase:
    """
    Retrieves a question by its identifier.
    """

    def __init__(self, repository: QuestionRepository):
        self.repository = repository

    def execute(self, identifier: str) -> Question | None:
        return self.repository.get(identifier)