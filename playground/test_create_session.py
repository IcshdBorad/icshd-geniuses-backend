from core.persistence.memory_database import MemoryDatabase
from core.repositories.memory_session_repository import MemorySessionRepository
from core.use_cases.create_session import CreateSessionUseCase

from packages.contracts.learning_session import LearningSession


db = MemoryDatabase()

repository = MemorySessionRepository(db)

use_case = CreateSessionUseCase(repository)

session = LearningSession(
    identifier="SESSION-001",
    learner_id="L001",
)

use_case.execute(session)

print(repository.get("SESSION-001"))