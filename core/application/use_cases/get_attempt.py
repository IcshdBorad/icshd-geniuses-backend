from core.repositories.attempt_repository import AttemptRepository
from packages.contracts.attempt import Attempt


class GetAttemptUseCase:
    """
    Retrieves an attempt by its identifier.
    """

    def __init__(self, repository: AttemptRepository):
        self.repository = repository

    def execute(self, identifier: str) -> Attempt | None:
        return self.repository.get(identifier)