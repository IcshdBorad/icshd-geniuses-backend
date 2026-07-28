from __future__ import annotations

from dataclasses import dataclass

# ==========================================================
# DTOs
# ==========================================================

from core.application.dto.create_session_result import (
    CreateSessionResult,
)
from core.application.dto.dashboard import (
    LearnerDashboard,
)
from core.application.dto.submit_answer_request import (
    SubmitAnswerRequest,
)
from core.application.dto.submit_answer_response import (
    SubmitAnswerResponse,
)

# ==========================================================
# Domain
# ==========================================================

from packages.contracts.question import Question

# ==========================================================
# Use Cases
# ==========================================================

from core.application.use_cases.start_learning_session import (
    StartLearningSessionUseCase,
)
from core.application.use_cases.submit_answer import (
    SubmitAnswerUseCase,
)
from core.application.use_cases.get_next_question import (
    GetNextQuestionUseCase,
)
from core.application.use_cases.get_review_questions import (
    GetReviewQuestionsUseCase,
)
from core.application.use_cases.get_learner_dashboard import (
    GetLearnerDashboardUseCase,
)
from core.application.use_cases.reset_progress import (
    ResetProgressUseCase,
)


@dataclass(slots=True)
class LearningEngine:
    """
    Application Facade.

    This is the single entry point used by the presentation
    layer (FastAPI, CLI, gRPC, etc.).

    The engine contains no business logic.
    It simply delegates execution to the appropriate use case.
    """

    start_learning_use_case: StartLearningSessionUseCase

    submit_answer_use_case: SubmitAnswerUseCase

    next_question_use_case: GetNextQuestionUseCase

    review_questions_use_case: GetReviewQuestionsUseCase

    learner_dashboard_use_case: GetLearnerDashboardUseCase

    reset_progress_use_case: ResetProgressUseCase

    # ---------------------------------------------------------
    # Learning
    # ---------------------------------------------------------

    def start(
        self,
        learner_id: str,
    ) -> CreateSessionResult:
        """
        Start a new adaptive learning session.
        """

        return self.start_learning_use_case.execute(
            learner_id=learner_id,
        )

    def submit(
        self,
        request: SubmitAnswerRequest,
    ) -> SubmitAnswerResponse:
        """
        Submit a learner answer.
        """

        return self.submit_answer_use_case.execute(
            request=request,
        )

    # ---------------------------------------------------------
    # Questions
    # ---------------------------------------------------------

    def next_question(
        self,
        learner_id: str,
    ) -> Question:
        """
        Return the next adaptive question.
        """

        return self.next_question_use_case.execute(
            learner_id=learner_id,
        )

    def review_questions(
        self,
        learner_id: str,
    ) -> list[Question]:
        """
        Return all questions currently due for review.
        """

        return self.review_questions_use_case.execute(
            learner_id=learner_id,
        )

    # ---------------------------------------------------------
    # Dashboard
    # ---------------------------------------------------------

    def dashboard(
        self,
        learner_id: str,
    ) -> LearnerDashboard:
        """
        Return learner dashboard.
        """

        return self.learner_dashboard_use_case.execute(
            learner_id=learner_id,
        )

    # ---------------------------------------------------------
    # Progress
    # ---------------------------------------------------------

    def reset(
        self,
        learner_id: str,
    ) -> None:
        """
        Reset learner progress.
        """

        self.reset_progress_use_case.execute(
            learner_id=learner_id,
        )