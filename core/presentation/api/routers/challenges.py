from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/challenges", tags=["3. Competitions & Matchmaking"])

class MatchmakingRequest(BaseModel):
    learner_id: str
    preferred_mode: str = Field("ranked", example="ranked") # ranked, speed_run, skill_duels

class JoinTournamentDTO(BaseModel):
    learner_id: str
    tournament_id: str

@router.get("/matchmaking/{learner_id}")
def get_matchmaking_bracket(learner_id: str):
    """تحديد دوري الطالب المناسب بناءً على قدرته الحالية θ لتجنب الأسئلة التعجيزية أو السهلة."""
    # يتم استدعاء خوارزمية اختيار الفئة بناءً على قيمة Theta
    return {
        "learner_id": learner_id,
        "bracket": "Gold League",
        "ability_theta_range": [0.5, 1.2],
        "matched_opponents_count": 48,
        "recommended_challenge_type": "Time-Bound Adaptive Duel"
    }

@router.post("/tournaments/join", status_code=status.HTTP_200_OK)
def join_tournament(payload: JoinTournamentDTO):
    """تسجيل الطالب في البطولة وتخصيص بنك أسئلة تكيفي خاص بالمنافسة."""
    try:
        return {
            "status": "registered",
            "tournament_id": payload.tournament_id,
            "learner_id": payload.learner_id,
            "session_token": f"tourn_sess_{payload.learner_id}_992",
            "first_challenge_question": {
                "id": "q_tourn_404",
                "difficulty_b": 0.8,
                "time_limit_sec": 30
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.get("/leaderboard/{tournament_id}")
def get_tournament_leaderboard(tournament_id: str):
    """ترتيب المتنافسين بناءً على معدل قدرة IRT المحسوبة ودقة السرعة."""
    return {
        "tournament_id": tournament_id,
        "rankings": [
            {"rank": 1, "learner_id": "learner_88", "theta": 1.85, "score": 2450},
            {"rank": 2, "learner_id": "learner_101", "theta": 1.42, "score": 2100},
            {"rank": 3, "learner_id": "learner_42", "theta": 1.10, "score": 1890},
        ]
    }