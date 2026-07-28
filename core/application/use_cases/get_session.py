from core.repositories.session_repository import SessionRepository
from packages.contracts.learning_session import LearningSession


class GetSessionUseCase:
    """
    Retrieves a learning session by its identifier.
    """

    def __init__(self, repository: SessionRepository):
        self.repository = repository

    def execute(self, identifier: str) -> LearningSession | None:
        return self.repository.get(identifier)