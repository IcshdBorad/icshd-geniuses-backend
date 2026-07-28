from __future__ import annotations

from packages.contracts.learner import Learner

from packages.contracts.learning_session import (
    LearningSession,
)

from packages.contracts.question import Question

from packages.contracts.submit_answer_request import (
    SubmitAnswerRequest,
)

from core.services.learning.answer_validator import (
    AnswerValidationResult,
)

from core.services.learning.attempt_factory import (
    AttemptFactory,
)


class SubmitAttempt:
    """
    Attempt Creation and Persistence Use Case.

    Responsibilities
    ----------------
    - Create Attempt entity.
    - Persist Attempt.
    - Return stored Attempt.

    This use case does NOT:
    - validate answers
    - update learner progress
    - evaluate performance
    - generate recommendations
    """

    def __init__(
        self,
        attempt_factory: AttemptFactory,
        attempt_repository,
    ) -> None:

        self.attempt_factory = attempt_factory

        self.attempt_repository = attempt_repository

    # =========================================================
    # Execute
    # =========================================================

    def execute(
        self,
        learner: Learner,
        session: LearningSession,
        question: Question,
        request: SubmitAnswerRequest,
        validation: AnswerValidationResult,
    ):
        """
        Creates and persists a learner attempt.
        """

        attempt = self.attempt_factory.create(
            learner=learner,
            session=session,
            question=question,
            request=request,
            validation=validation,
        )

        self.attempt_repository.save(
            attempt
        )

        return attempt