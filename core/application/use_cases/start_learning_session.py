from __future__ import annotations

from collections.abc import Sequence
from uuid import uuid4

from core.application.dto.create_session_result import (
    CreateSessionResult,
)

from core.application.ports.clock import Clock
from core.application.ports.learner_repository import (
    LearnerRepository,
)
from core.application.ports.question_repository import (
    QuestionRepository,
)
from core.application.ports.session_repository import (
    SessionRepository,
)
from core.application.ports.skill_repository import (
    SkillRepository,
)

from core.services.learning.next_question_pipeline import (
    NextQuestionPipeline,
)

from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.question import Question
from packages.contracts.skill import Skill


class StartLearningSessionUseCase:
    """
    Starts a new adaptive learning session.

    Workflow
    --------
    1. Load learner.
    2. Load skills.
    3. Load questions.
    4. Load learner attempts.
    5. Create learning session.
    6. Execute adaptive pipeline.
    7. Persist session.
    8. Return session information.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        sessions: SessionRepository,
        skills: SkillRepository,
        questions: QuestionRepository,
        attempts,
        next_question_pipeline: NextQuestionPipeline,
        clock: Clock,
    ) -> None:

        self._learners = learners
        self._sessions = sessions
        self._skills = skills
        self._questions = questions
        self._attempts = attempts

        self._next_question_pipeline = (
            next_question_pipeline
        )

        self._clock = clock

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner_id: str,
    ) -> CreateSessionResult:

        learner = self._load_learner(
            learner_id,
        )

        skills = self._load_skills()

        questions = self._load_questions()

        attempts = self._load_attempts(
            learner_id,
        )

        session = self._create_session(
            learner,
        )

        result = (
            self._next_question_pipeline.execute(
                learner=learner,
                session=session,
                skills=skills,
                questions=questions,
                attempts=attempts,
            )
        )

        if result.finished:
            raise ValueError(
                "No learning content available."
            )

        if result.question is None:
            raise ValueError(
                "Unable to select the first question."
            )

        session.current_question_id = (
            result.question.identifier
        )

        self._sessions.save(
            session,
        )

        return CreateSessionResult(
            session_id=session.identifier,
            learner_id=learner.identifier,
            question_id=result.question.identifier,
            started_at=session.started_at,
        )

    # ---------------------------------------------------------
    # Internal Helpers
    # ---------------------------------------------------------

    def _create_session(
        self,
        learner: Learner,
    ) -> LearningSession:

        return LearningSession(
            identifier=str(uuid4()),
            learner_id=learner.identifier,
            started_at=self._clock.now(),
            current_question_id=None,
        )

    def _load_learner(
        self,
        learner_id: str,
    ) -> Learner:

        learner = self._learners.get(
            learner_id,
        )

        if learner is None:
            raise ValueError(
                f"Learner '{learner_id}' not found."
            )

        return learner

    def _load_skills(
        self,
    ) -> Sequence[Skill]:

        skills = self._skills.list()

        if not skills:
            raise ValueError(
                "No skills available."
            )

        return skills

    def _load_questions(
        self,
    ) -> Sequence[Question]:

        questions = self._questions.list()

        if not questions:
            raise ValueError(
                "No questions available."
            )

        return questions

    def _load_attempts(
        self,
        learner_id: str,
    ) -> Sequence[Attempt]:

        attempts = self._attempts.list_by_learner(
            learner_id,
        )

        return attempts or []