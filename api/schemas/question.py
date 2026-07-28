from __future__ import annotations

from api.schemas.common import APIModel


class QuestionResponse(APIModel):
    """
    Public question representation.
    """

    identifier: str

    skill_id: str

    prompt: str

    difficulty: float