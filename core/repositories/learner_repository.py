from abc import ABC, abstractmethod
from packages.contracts.learner import Learner


class LearnerRepository(ABC):
    """
    Repository interface for Learner objects.
    """

    @abstractmethod
    def get(self, identifier: str) -> Learner | None:
        ...

    @abstractmethod
    def save(self, learner: Learner) -> None:
        ...

    @abstractmethod
    def list(self) -> list[Learner]:
        ...