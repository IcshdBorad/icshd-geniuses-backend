from packages.contracts.skill import Skill
from core.domains.knowledge.repository import KnowledgeRepository


class KnowledgeService:
    """
    Application service for managing canonical knowledge.
    """

    def __init__(self, repository: KnowledgeRepository):
        self._repository = repository

    def register_skill(self, skill: Skill) -> None:
        self._repository.add_skill(skill)

    def find_skill(self, identifier: str) -> Skill | None:
        return self._repository.get_skill(identifier)

    def list_skills(self) -> list[Skill]:
        return self._repository.list_skills()