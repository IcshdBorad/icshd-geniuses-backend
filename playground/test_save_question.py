from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_question_repository import MemoryQuestionRepository
from core.use_cases.save_question import SaveQuestionUseCase

from packages.contracts.question import Question


db = MemoryDatabase()

repository = MemoryQuestionRepository(db)

use_case = SaveQuestionUseCase(repository)

question = Question(
    identifier="Q-001",
    skill_id="SKILL-ADD-001",
    prompt="3 + 5 = ?",
    answer="8",
)

use_case.execute(question)

print(repository.get("Q-001"))