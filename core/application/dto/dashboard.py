from fastapi import APIRouter, HTTPException, status
# تعديل المسارات إلى core.application إذا كان المجلد يستورد أي use cases
try:
    from core.application.use_cases.get_dashboard_stats import GetDashboardStatsUseCase
except ModuleNotFoundError:
    pass

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats")
async def get_dashboard_stats():
    return {"status": "success", "data": {}}