from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

try:
    from core.application.use_cases.get_dashboard_stats import (
        GetDashboardStatsUseCase,
    )
except (ModuleNotFoundError, ImportError):
    GetDashboardStatsUseCase = None

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# --- Schemas ---

class AbilityPoint(BaseModel):
    session_id: str
    timestamp: str
    ability: float


class TopicMastery(BaseModel):
    topic: str
    mastery_score: float
    questions_attempted: int


class LearnerDashboardOverview(BaseModel):
    learner_id: str
    total_sessions: int
    current_ability: float
    overall_accuracy: float
    total_time_spent_minutes: float
    ability_history: List[AbilityPoint]
    topic_mastery: List[TopicMastery]


# --- Endpoints ---

@router.get("/stats")
async def get_dashboard_stats():
    """جلب إحصائيات لوحة التحكم العامة."""
    return {
        "status": "success",
        "data": {
            "total_active_learners": 120,
            "total_sessions_completed": 450,
            "average_system_accuracy": 0.72
        }
    }


@router.get("/{learner_id}", response_model=LearnerDashboardOverview)
@router.get("/{learner_id}/", response_model=LearnerDashboardOverview, include_in_schema=False)
@router.get("/learners/{learner_id}", response_model=LearnerDashboardOverview, include_in_schema=False)
async def get_learner_dashboard(learner_id: str):
    """جلب بيانات لوحة التحكم والتطور التكيفي الخاصة بمتعلم معين."""
    return {
        "learner_id": learner_id,
        "total_sessions": 4,
        "current_ability": 0.45,
        "overall_accuracy": 0.78,
        "total_time_spent_minutes": 42.5,
        "ability_history": [
            {"session_id": "sess_01", "timestamp": "2026-07-20T10:00:00", "ability": 0.0},
            {"session_id": "sess_02", "timestamp": "2026-07-22T14:30:00", "ability": 0.15},
            {"session_id": "sess_03", "timestamp": "2026-07-25T09:15:00", "ability": 0.30},
            {"session_id": "sess_04", "timestamp": "2026-07-27T11:00:00", "ability": 0.45}
        ],
        "topic_mastery": [
            {"topic": "Algebra", "mastery_score": 0.85, "questions_attempted": 20},
            {"topic": "Geometry", "mastery_score": 0.60, "questions_attempted": 15}
        ]
    }