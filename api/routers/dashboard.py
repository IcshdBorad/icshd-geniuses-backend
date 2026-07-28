from fastapi import APIRouter, HTTPException, status

try:
    from core.application.use_cases.get_dashboard_stats import (
        GetDashboardStatsUseCase,
    )
except ModuleNotFoundError:
    pass

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats():
    """جلب إحصائيات لوحة التحكم العامة."""
    return {"status": "success", "data": {}}


@router.get("/{learner_id}")
@router.get("/{learner_id}/")
async def get_learner_dashboard(learner_id: str):
    """جلب بيانات لوحة التحكم الخاصة بمتعلم معين."""
    return {
        "status": "success",
        "data": {
            "learner_id": learner_id,
            "progress": 0,
            "status": "active",
        },
    }