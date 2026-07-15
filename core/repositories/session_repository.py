from abc import ABC, abstractmethod
from packages.contracts.learning_session import LearningSession


class SessionRepository(ABC):
    """
    Repository interface for LearningSession objects.
    """

    @abstractmethod
    def get(self, identifier: str) -> LearningSession | None:
        ...

    @abstractmethod
    def save(self, session: LearningSession) -> None:
        ...

    @abstractmethod
    def list(self) -> list[LearningSession]:
        ...