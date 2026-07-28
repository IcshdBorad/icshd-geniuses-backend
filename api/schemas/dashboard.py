from __future__ import annotations

from api.schemas.common import APIModel


class DashboardResponse(APIModel):
    """
    Learner dashboard.
    """

    competency: float

    mastery: float

    recommendations: list[str]