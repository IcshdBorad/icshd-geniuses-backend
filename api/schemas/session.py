from __future__ import annotations

from datetime import datetime

from api.schemas.common import APIModel


class StartSessionRequest(APIModel):
    """
    Request to start a learning session.
    """

    learner_id: str


class StartSessionResponse(APIModel):
    """
    Response after creating a session.
    """

    session_id: str
    learner_id: str
    question_id: str
    started_at: datetime