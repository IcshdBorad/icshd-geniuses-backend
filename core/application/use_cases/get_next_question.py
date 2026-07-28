from __future__ import annotations

from collections.abc import Sequence

from core.application.ports.attempt_repository import (
    AttemptRepository,
)
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
from packages.contracts.learning_session import LearningSession
from packages.contracts.question import Question
from packages.contracts.skill import Skill


class GetNextQuestionUseCase:
    """
    Determines the learner's next adaptive question.

    Workflow
    --------
    1. Load learner.
    2. Load active session.
    3. Load skills.
    4. Load questions.
    5. Load learner attempts.
    6. Execute adaptive pipeline.
    7. Return next question.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        sessions: SessionRepository,
        skills: SkillRepository,
        questions: QuestionRepository,
        attempts: AttemptRepository,
        next_question_pipeline: NextQuestionPipeline,
    ) -> None:

        self._learners = learners
        self._sessions = sessions
        self._skills = skills
        self._questions = questions
        self._attempts = attempts

        self._next_question_pipeline = (
            next_question_pipeline
        )

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner_id: str,
        session_id: str,
    ) -> Question | None:

        learner = self._load_learner(
            learner_id,
        )

        session = self._load_session(
            session_id,
        )

        result = self._next_question_pipeline.execute(
            learner=learner,
            session=session,
            skills=self._load_skills(),
            questions=self._load_questions(),
            attempts=self._load_attempts(
                learner.identifier,
            ),
        )

        return result.question

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

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

    def _load_session(
        self,
        session_id: str,
    ) -> LearningSession:

        session = self._sessions.get(
            session_id,
        )

        if session is None:
            raise ValueError(
                f"Session '{session_id}' not found."
            )

        return session

    def _load_skills(
        self,
    ) -> Sequence[Skill]:

        return self._skills.list()

    def _load_questions(
        self,
    ) -> Sequence[Question]:

        return self._questions.list()

    def _load_attempts(
        self,
        learner_id: str,
    ) -> Sequence[Attempt]:

        return self._attempts.list_by_learner(
            learner_id,
        )