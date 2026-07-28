from __future__ import annotations

from core.application.ports.skill_repository import (
    SkillRepository,
)
from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)

from packages.contracts.skill import Skill


class MemorySkillRepository(
    SkillRepository,
):
    """
    In-memory implementation of SkillRepository.
    """

    def __init__(
        self,
        database: MemoryDatabase,
    ) -> None:
        self._database = database

    # ---------------------------------------------------------
    # CRUD
    # ---------------------------------------------------------

    def get(
        self,
        identifier: str,
    ) -> Skill | None:

        return self._database.skills.get(
            identifier,
        )

    def save(
        self,
        skill: Skill,
    ) -> None:

        self._database.skills[
            skill.identifier
        ] = skill

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    def list(
        self,
    ) -> list[Skill]:

        return list(
            self._database.skills.values(),
        )

    def list_active(
        self,
    ) -> list[Skill]:

        return [
            skill
            for skill in self._database.skills.values()
            if getattr(
                skill,
                "active",
                True,
            )
        ]