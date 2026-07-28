from __future__ import annotations

from api.schemas.common import APIModel


class LearnerResponse(APIModel):
    """
    Learner information returned by the API.
    """

    identifier: str
    full_name: str