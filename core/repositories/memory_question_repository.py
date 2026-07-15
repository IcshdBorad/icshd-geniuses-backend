from core.repositories.question_repository import QuestionRepository
from core.persistence.memory_database import MemoryDatabase
from packages.contracts.question import Question


class MemoryQuestionRepository(QuestionRepository):
    """
    In-memory implementation of QuestionRepository.
    """

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def get(self, identifier: str) -> Question | None:
        return self.database.questions.get(identifier)

    def save(self, question: Question) -> None:
        self.database.questions[question.identifier] = question

    def list(self) -> list[Question]:
        return list(self.database.questions.values())