from __future__ import annotations

from api.schemas.common import APIModel


class RecommendationResponse(APIModel):
    """
    Recommendation payload.
    """

    recommendations: list[str]