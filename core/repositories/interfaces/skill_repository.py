from abc import ABC, abstractmethod
from packages.contracts.skill import Skill


class SkillRepository(ABC):

    @abstractmethod
    def get(self, identifier: str) -> Skill | None:
        ...

    @abstractmethod
    def save(self, skill: Skill) -> None:
        ...

    @abstractmethod
    def list(self) -> list[Skill]:
        ...