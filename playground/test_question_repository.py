from core.persistence.memory_database import MemoryDatabase
from core.repositories.question_repository import QuestionRepository
from packages.contracts.question import Question

db = MemoryDatabase()
repo = QuestionRepository(db)

repo.add(
    Question(
        identifier="Q-001",
        skill_id="SKILL-ADD-001",
        prompt="3 + 5 = ?",
        answer="8",
        difficulty=1,
        question_type="short_answer",
    )
)

print(repo.by_id("Q-001"))
print(repo.all())