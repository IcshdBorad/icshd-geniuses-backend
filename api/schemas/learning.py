from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StartLearningSessionRequest(BaseModel):
    """
    Request to start a new adaptive learning session.
    """

    learner_id: str = Field(
        ...,
        description="Unique learner identifier.",
    )


class StartLearningSessionResponse(BaseModel):
    """
    Response returned after creating a learning session.
    """

    model_config = ConfigDict(from_attributes=True)

    session_id: str
    learner_id: str
    question_id: str
    started_at: datetime


class SubmitAnswerRequestModel(BaseModel):
    """
    Request to submit an answer.
    """

    learner_id: str
    session_id: str
    submitted_answer: str


class SubmitAnswerResponse(BaseModel):
    """
    Result returned after evaluating an answer.
    """

    model_config = ConfigDict(from_attributes=True)

    is_correct: bool
    score: float
    next_question_id: str | None = None
    session_completed: bool = False
    recommendations: list[str] = Field(default_factory=list)