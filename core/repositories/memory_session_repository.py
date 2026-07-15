from core.repositories.session_repository import SessionRepository
from core.persistence.memory_database import MemoryDatabase
from packages.contracts.learning_session import LearningSession


class MemorySessionRepository(SessionRepository):
    """
    In-memory implementation of SessionRepository.
    """

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def get(self, identifier: str) -> LearningSession | None:
        return self.database.sessions.get(identifier)

    def save(self, session: LearningSession) -> None:
        self.database.sessions[session.identifier] = session

    def list(self) -> list[LearningSession]:
        return list(self.database.sessions.values())