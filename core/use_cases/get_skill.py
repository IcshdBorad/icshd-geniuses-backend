from core.repositories.skill_repository import SkillRepository
from packages.contracts.skill import Skill


class GetSkillUseCase:
    """
    Retrieves a skill by its identifier.
    """

    def __init__(self, repository: SkillRepository):
        self.repository = repository

    def execute(self, identifier: str) -> Skill | None:
        return self.repository.get(identifier)