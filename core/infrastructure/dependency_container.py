from __future__ import annotations

from dataclasses import dataclass, field

# ==========================================================
# Infrastructure
# ==========================================================

from core.infrastructure.persistence.memory_database import (
    MemoryDatabase,
)

from core.infrastructure.persistence.memory_unit_of_work import (
    MemoryUnitOfWork,
)

from core.infrastructure.clock.system_clock import (
    SystemClock,
)

from core.infrastructure.repositories.memory_learner_repository import (
    MemoryLearnerRepository,
)

from core.infrastructure.repositories.memory_skill_repository import (
    MemorySkillRepository,
)

from core.infrastructure.repositories.memory_question_repository import (
    MemoryQuestionRepository,
)

from core.infrastructure.repositories.memory_session_repository import (
    MemorySessionRepository,
)

from core.infrastructure.repositories.memory_attempt_repository import (
    MemoryAttemptRepository,
)

# ==========================================================
# Composition Root
# ==========================================================


@dataclass(slots=True)
class DependencyContainer:
    """
    Central application dependency container.

    Responsibilities
    ----------------
    - Own shared infrastructure objects.
    - Create repositories.
    - Create UnitOfWork.
    - Expose shared dependencies.

    Higher-level services, pipelines and use cases
    are assembled later inside bootstrap.py.
    """

    database: MemoryDatabase
    clock: SystemClock = field(init=False)
    unit_of_work: MemoryUnitOfWork = field(init=False)
    learners: MemoryLearnerRepository = field(init=False)
    skills: MemorySkillRepository = field(init=False)
    questions: MemoryQuestionRepository = field(init=False)
    sessions: MemorySessionRepository = field(init=False)
    attempts: MemoryAttemptRepository = field(init=False)

    def __post_init__(self) -> None:

        # --------------------------------------------------
        # Infrastructure
        # --------------------------------------------------

        self.clock = SystemClock()
        self.unit_of_work = MemoryUnitOfWork()

        # --------------------------------------------------
        # Repositories
        # --------------------------------------------------

        self.learners = MemoryLearnerRepository(self.database)
        self.skills = MemorySkillRepository(self.database)
        self.questions = MemoryQuestionRepository(self.database)
        self.sessions = MemorySessionRepository(self.database)
        self.attempts = MemoryAttemptRepository(self.database)