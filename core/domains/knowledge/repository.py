from packages.contracts.skill import Skill


class KnowledgeRepository:
    """
    In-memory repository for canonical knowledge entities.
    """

    def __init__(self):
        self._skills: dict[str, Skill] = {}

    def add_skill(self, skill: Skill) -> None:
        self._skills[skill.identifier] = skill

    def get_skill(self, identifier: str) -> Skill | None:
        return self._skills.get(identifier)

    def list_skills(self) -> list[Skill]:
        return list(self._skills.values())