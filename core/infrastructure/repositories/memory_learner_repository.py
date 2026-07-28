from __future__ import annotations

from collections.abc import Sequence

from core.application.ports.learner_repository import (
    LearnerRepository,
)
from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)
from packages.contracts.learner import Learner


class MemoryLearnerRepository(
    LearnerRepository,
):
    """
    In-memory implementation of LearnerRepository.

    Responsibilities
    ----------------
    - Persist learners.
    - Retrieve learners.
    - Query learner records.

    Uses MemoryDatabase as the shared
    in-memory persistence backend.

    This implementation is intended for:
    - Unit tests
    - Integration tests
    - Local development

    It is not thread-safe.
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
    ) -> Learner | None:
        """
        Retrieve a learner by identifier.
        """
        return self._database.learners.get(
            identifier,
        )

    def save(
        self,
        learner: Learner,
    ) -> None:
        """
        Persist a learner.
        """
        self._database.learners[
            learner.identifier
        ] = learner

    def delete(
        self,
        identifier: str,
    ) -> None:
        """
        Delete a learner.
        """
        self._database.learners.pop(
            identifier,
            None,
        )

    # ---------------------------------------------------------
    # Queries
    # ---------------------------------------------------------

    def list(
        self,
    ) -> Sequence[Learner]:
        """
        Return all learners.
        """
        return tuple(
            self._database.learners.values()
        )

    def exists(
        self,
        identifier: str,
    ) -> bool:
        """
        Return whether a learner exists.
        """
        return (
            identifier
            in self._database.learners
        )

    def count(
        self,
    ) -> int:
        """
        Return the total number of learners.
        """
        return len(
            self._database.learners
        )


# Supporting both naming conventions
InMemoryLearnerRepository = MemoryLearnerRepository