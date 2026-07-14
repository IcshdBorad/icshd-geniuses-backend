from core.persistence.memory_database import MemoryDatabase
from core.repositories.question_repository import QuestionRepository
from core.domains.generation.generator import QuestionGenerator
from core.domains.generation.template import QuestionTemplate


class GenerationService:

    def __init__(self):
        self.database = MemoryDatabase()
        self.repository = QuestionRepository(self.database)
        self.generator = QuestionGenerator()

    def generate(self, template: QuestionTemplate):
        question = self.generator.generate(template)
        self.repository.add(question)
        return question

    def all_questions(self):
        return self.repository.all()