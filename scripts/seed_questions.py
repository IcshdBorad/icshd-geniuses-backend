import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.infrastructure.persistence.memory_database import MemoryDatabase
from core.infrastructure.repositories.memory_question_repository import (
    MemoryQuestionRepository,
)
from packages.contracts.question import Question


def get_seed_questions() -> list[Question]:
    return [
        Question(
            identifier="q_algebra_01",
            skill_id="algebra",
            prompt="x + 2 = 5",
            answer="x = 3",
            difficulty=1.0,
            question_type="short_answer",
        ),
        Question(
            identifier="q_algebra_02",
            skill_id="algebra",
            prompt="2x + 4 = 10",
            answer="x = 3",
            difficulty=1.3,
            question_type="short_answer",
        ),
        Question(
            identifier="q_algebra_03",
            skill_id="algebra",
            prompt="3x - 5 = 10",
            answer="x = 5",
            difficulty=1.6,
            question_type="short_answer",
        ),
        Question(
            identifier="q_algebra_04",
            skill_id="algebra",
            prompt="2(x + 1) = 8",
            answer="x = 3",
            difficulty=1.9,
            question_type="short_answer",
        ),
        Question(
            identifier="q_algebra_05",
            skill_id="algebra",
            prompt="x^2 = 9 (where x > 0)",
            answer="x = 3",
            difficulty=2.2,
            question_type="short_answer",
        ),
    ]


def seed_memory_database(db: MemoryDatabase) -> MemoryQuestionRepository:
    repo = MemoryQuestionRepository(database=db)
    questions = get_seed_questions()

    for q in questions:
        repo.save(q)

    print(f" Successfully seeded {len(questions)} questions into MemoryDatabase.")
    return repo


if __name__ == "__main__":
    test_db = MemoryDatabase()
    seed_memory_database(test_db)