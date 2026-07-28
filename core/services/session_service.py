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


class SessionService:
    """
    Application facade for learning sessions.

    Responsibilities
    ----------------
    - Start learning sessions.
    - Submit learner answers.

    This service delegates all business logic to
    application use cases.
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
    # Start Session
    # ---------------------------------------------------------

    def start_session(
        self,
        learner_id: str,
    ) -> LearningSession:
        """
        Starts a new adaptive learning session.
        """

        return self._start_learning_session.execute(
            learner_id
        )

    # ---------------------------------------------------------
    # Submit Answer
    # ---------------------------------------------------------

    def submit_answer(
        self,
        request: SubmitAnswerRequest,
    ) -> SubmitAnswerResult:
        """
        Submit an answer for the current session.
        """

        return self._submit_answer.execute(
            request
        )