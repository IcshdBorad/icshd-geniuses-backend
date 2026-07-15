from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_question_repository import MemoryQuestionRepository
from packages.contracts.question import Question


db = MemoryDatabase()

repo = MemoryQuestionRepository(db)

question = Question(
    identifier="Q-001",
    skill_id="SKILL-ADD-001",
    prompt="3 + 5 = ?",
    answer="8",
    difficulty=1,
    question_type="short_answer",
)

repo.save(question)

print(repo.get("Q-001"))
print(repo.list())