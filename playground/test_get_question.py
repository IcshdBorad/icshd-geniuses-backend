from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_question_repository import MemoryQuestionRepository
from core.use_cases.get_question import GetQuestionUseCase

from packages.contracts.question import Question


db = MemoryDatabase()

repository = MemoryQuestionRepository(db)

repository.save(
    Question(
        identifier="Q-001",
        skill_id="SKILL-ADD-001",
        prompt="3 + 5 = ?",
        answer="8",
    )
)

use_case = GetQuestionUseCase(repository)

print(use_case.execute("Q-001"))