from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import Dict, Any, List
from core.infrastructure.generators.soroban_generator import SorobanGenerator
from core.presentation.api.routers.admin_settings import SYSTEM_CONFIG

router = APIRouter(prefix="/api/v1/portal", tags=["Unified Global Portal"])

class LoginRequest(BaseModel):
    genius_code: str

@router.post("/auth/login")
def login_with_genius_code(payload: LoginRequest) -> Dict[str, Any]:
    """
    التحقق من كود العبقري الموحد وتوجيه المستخدم للوحة التحكم الخاصة بدوره تلقائياً.
    """
    code = payload.genius_code.upper().strip()
    
    # محاكاة التوجيه بناءً على بادئة شفرة العبقري الموحدة
    if code.startswith("ICSHD-A"):
        return {"role": "ADMIN", "redirect": "/admin-dashboard", "user_data": {"name": "المشرف العام"}}
    elif code.startswith("ICSHD-C"):
        return {"role": "COACH", "redirect": "/coach-dashboard", "user_data": {"name": "المدرب الدولي"}}
    elif code.startswith("ICSHD-P"):
        return {"role": "PARENT", "redirect": "/parent-dashboard", "user_data": {"name": "ولي الأمر"}}
    else:
        return {"role": "LEARNER", "redirect": "/learner-arena", "user_data": {"code": code, "level": "MIX"}}

@router.get("/arena/next-challenge")
def get_arena_challenge(
    level: str = Query("MIX", description="المستوى: S, F5, F10, MIX"),
    digits: int = Query(1, ge=1, le=5),
    rows: int = Query(3, ge=2, le=50)
) -> Dict[str, Any]:
    """
    المحرك الموحد لتوليد المسابقات والتدريبات الحية لكافة البطولات والمستويات.
    """
    problem = SorobanGenerator.generate_problem(
        level=level,
        digits_count=digits,
        rows_count=rows
    )
    # إضافة الوقت المحدد مركزيًا من الإدارة فقط
    problem["timer_seconds"] = SYSTEM_CONFIG.get("timer_seconds", 60)
    return problem