from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_question_repository import MemoryQuestionRepository
from packages.contracts.question import Question


class GenerationService:
    """
    Application service for question generation.
    """

    def __init__(self):
        self.database = MemoryDatabase()
        self.questions = MemoryQuestionRepository(self.database)

    def save_question(self, question: Question):
        self.questions.save(question)

    def get_question(self, identifier: str):
        return self.questions.get(identifier)

    def list_questions(self):
        return self.questions.list()