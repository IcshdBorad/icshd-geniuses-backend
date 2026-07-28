from __future__ import annotations

from typing import Protocol

from packages.contracts.skill import Skill


class SkillRepository(Protocol):
    """
    Repository interface for skills.
    """

    def get(
        self,
        identifier: str,
    ) -> Skill | None:
        ...

    def save(
        self,
        skill: Skill,
    ) -> None:
        ...

    def list(
        self,
    ) -> list[Skill]:
        ...