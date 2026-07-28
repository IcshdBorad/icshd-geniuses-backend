from __future__ import annotations

from typing import Protocol

from packages.contracts.skill import Skill


class SkillRepository(Protocol):
    """
    Persistence contract for skills.
    """

    def get(
        self,
        skill_id: str,
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