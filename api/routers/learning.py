from __future__ import annotations

from fastapi import APIRouter
from fastapi import Depends

from api.dependencies import get_engine

from core.application.services.learning_engine import (
    LearningEngine,
)

from packages.contracts.learning.submit_answer_request import (
    SubmitAnswerRequest,
)
from packages.contracts.start_learning_result import (
    StartLearningResult,
)
from packages.contracts.submit_answer_result import (
    SubmitAnswerResult,
)

router = APIRouter(
    prefix="/learning",
    tags=["Learning"],
)


@router.post(
    "/start",
    response_model=StartLearningResult,
)
def start_learning(
    learner_id: str,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Start a new adaptive learning session.
    """
    return engine.start(
        learner_id=learner_id,
    )


@router.post(
    "/submit",
    response_model=SubmitAnswerResult,
)
def submit_answer(
    request: SubmitAnswerRequest,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Submit learner answer.
    """
    return engine.submit(
        request=request,
    )


@router.get(
    "/next",
)
def get_next_question(
    learner_id: str,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Return the next adaptive question.
    """
    return engine.next_question(
        learner_id=learner_id,
    )


@router.get(
    "/review",
)
def get_review_questions(
    learner_id: str,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Return review questions for the learner.
    """
    return engine.review_questions(
        learner_id=learner_id,
    )


@router.get(
    "/dashboard",
)
def learner_dashboard(
    learner_id: str,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Return learner dashboard.
    """
    return engine.dashboard(
        learner_id=learner_id,
    )


@router.post(
    "/reset",
)
def reset_progress(
    learner_id: str,
    engine: LearningEngine = Depends(get_engine),
):
    """
    Reset learner progress.
    """
    return engine.reset(
        learner_id=learner_id,
    )