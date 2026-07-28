from core.repositories.learner_repository import LearnerRepository
from packages.contracts.learner import Learner


class GetLearnerUseCase:

    def __init__(self, repository: LearnerRepository):
        self.repository = repository

    def execute(self, identifier: str) -> Learner | None:
        return self.repository.get(identifier)