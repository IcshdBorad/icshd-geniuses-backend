from core.repositories.learner_repository import LearnerRepository
from packages.contracts.learner import Learner


class SaveLearnerUseCase:

    def __init__(self, repository: LearnerRepository):
        self.repository = repository

    def execute(self, learner: Learner) -> None:
        self.repository.save(learner)