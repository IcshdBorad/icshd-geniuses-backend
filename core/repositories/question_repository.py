from abc import ABC, abstractmethod
from packages.contracts.question import Question


class QuestionRepository(ABC):
    """
    Repository interface for Question objects.
    """

    @abstractmethod
    def get(self, identifier: str) -> Question | None:
        ...

    @abstractmethod
    def save(self, question: Question) -> None:
        ...

    @abstractmethod
    def list(self) -> list[Question]:
        ...