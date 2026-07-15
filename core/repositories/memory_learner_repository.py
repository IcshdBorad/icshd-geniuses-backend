from core.repositories.learner_repository import LearnerRepository
from core.persistence.memory_database import MemoryDatabase
from packages.contracts.learner import Learner


class MemoryLearnerRepository(LearnerRepository):
    """
    In-memory implementation of LearnerRepository.
    """

    def __init__(self, database: MemoryDatabase):
        self.database = database

    def get(self, identifier: str) -> Learner | None:
        return self.database.learners.get(identifier)

    def save(self, learner: Learner) -> None:
        self.database.learners[learner.identifier] = learner

    def list(self) -> list[Learner]:
        return list(self.database.learners.values())