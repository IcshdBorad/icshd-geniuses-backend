from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SkillProgress(BaseModel):
    skill_id: str
    skill_title: str
    mastery_level: float = 0.0
    total_attempts: int = 0
    correct_attempts: int = 0


class LearnerDashboard(BaseModel):
    learner_id: str
    learner_name: str
    total_sessions: int = 0
    total_questions_answered: int = 0
    overall_accuracy: float = 0.0
    skills_progress: List[SkillProgress] = Field(default_factory=list)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)