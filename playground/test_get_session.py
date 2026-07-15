from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_session_repository import MemorySessionRepository
from core.use_cases.get_session import GetSessionUseCase

from packages.contracts.learning_session import LearningSession


db = MemoryDatabase()

repository = MemorySessionRepository(db)

repository.save(
    LearningSession(
        identifier="SESSION-001",
        learner_id="L001",
    )
)

use_case = GetSessionUseCase(repository)

print(use_case.execute("SESSION-001"))