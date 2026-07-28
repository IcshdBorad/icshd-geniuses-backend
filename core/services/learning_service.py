from __future__ import annotations

from core.application.use_cases.start_learning_session import (
    StartLearningSessionUseCase,
)
from core.application.use_cases.submit_answer import (
    SubmitAnswerUseCase,
)

from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.learning.submit_answer_request import (
    SubmitAnswerRequest,
)
from packages.contracts.submit_answer_result import (
    SubmitAnswerResult,
)


class LearningService:
    """
    High-level learning application facade.

    Responsibilities
    ----------------
    - Expose the learning API.
    - Delegate work to application use cases.

    This service contains NO business logic.
    """

    def __init__(
        self,
        start_learning_session: StartLearningSessionUseCase,
        submit_answer: SubmitAnswerUseCase,
    ) -> None:

        self._start_learning_session = (
            start_learning_session
        )

        self._submit_answer = (
            submit_answer
        )

    # ---------------------------------------------------------
    # Learning Session
    # ---------------------------------------------------------

    def start_learning_session(
        self,
        learner_id: str,
    ) -> LearningSession:
        """
        Starts a new adaptive learning session.
        """

        return self._start_learning_session.execute(
            learner_id=learner_id,
        )

    # ---------------------------------------------------------
    # Answer Submission
    # ---------------------------------------------------------

    def submit_answer(
        self,
        request: SubmitAnswerRequest,
    ) -> SubmitAnswerResult:
        """
        Processes a learner answer.
        """

        return self._submit_answer.execute(
            request,
        )