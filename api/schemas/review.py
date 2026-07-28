from __future__ import annotations

from api.schemas.common import APIModel


class ReviewQuestionResponse(APIModel):
    """
    Question scheduled for review.
    """

    identifier: str

    prompt: str

    due: bool