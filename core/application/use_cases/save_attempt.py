from core.repositories.attempt_repository import AttemptRepository
from packages.contracts.attempt import Attempt


class SaveAttemptUseCase:
    """
    Saves an attempt.
    """

    def __init__(self, repository: AttemptRepository):
        self.repository = repository

    def execute(self, attempt: Attempt) -> None:
        self.repository.save(attempt)