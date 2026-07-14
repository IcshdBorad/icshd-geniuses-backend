from packages.contracts.skill import Skill


class SkillRepository:
    """
    In-memory repository for skills.
    """

    def __init__(self):
        self._skills: list[Skill] = []

    def add(self, skill: Skill):
        self._skills.append(skill)

    def all(self):
        return self._skills

    def by_id(self, identifier: str):
        for skill in self._skills:
            if skill.identifier == identifier:
                return skill
        return None