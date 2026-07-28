from core.repositories.session_repository import SessionRepository
from packages.contracts.learning_session import LearningSession


class SaveSessionUseCase:
    """
    Saves a learning session.
    """

    def __init__(self, repository: SessionRepository):
        self.repository = repository

    def execute(self, session: LearningSession) -> None:
        self.repository.save(session)