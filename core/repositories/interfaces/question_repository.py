from core.persistence.memory_database import MemoryDatabase
from packages.contracts.question import Question


class QuestionRepository:

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def add(self, question: Question):
        self.database.questions[question.identifier] = question

    def by_id(self, identifier: str):
        return self.database.questions.get(identifier)

    def all(self):
        return list(self.database.questions.values())