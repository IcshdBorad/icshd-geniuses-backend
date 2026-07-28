# core/presentation/api/routers/adaptive.py
from __future__ import annotations

from enum import Enum
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.application.dto.submit_answer_request import SubmitAnswerRequest
from core.bootstrap import bootstrap
from core.infrastructure.dependency_container import DependencyContainer
from core.infrastructure.generators.soroban_generator import SorobanGenerator
from core.infrastructure.persistence.memory_database import MemoryDatabase
from core.presentation.api.routers.admin_settings import SYSTEM_CONFIG

router = APIRouter(prefix="/api/v1/adaptive", tags=["1. Adaptive Learning Engine"])


# ------------------------------------------------------------------------------
# Dependency Injection Context
# ------------------------------------------------------------------------------
def get_engine():
    """حقن تابع المحرك التكيّفي لضمان عزله عن نطاق الـ Endpoint وتسهيل الاختبارات."""
    db = MemoryDatabase()
    container = DependencyContainer(database=db)
    bootstrapped_app = bootstrap(
        learners=container.learners,
        sessions=container.sessions,
        questions=container.questions,
        skills=container.skills,
        attempts=container.attempts,
        unit_of_work=container.unit_of_work,
        clock=container.clock,
    )
    return bootstrapped_app.engine


# ------------------------------------------------------------------------------
# Data Transfer Objects (DTOs) & Enums
# ------------------------------------------------------------------------------
class SorobanLevelEnum(str, Enum):
    SIMPLE = "S"
    FRIENDS_OF_FIVE = "F5"
    FRIENDS_OF_TEN = "F10"
    MIXED = "MIX"


class StartSessionDTO(BaseModel):
    learner_id: str = Field(..., example="ICSHD-2026-89B2", description="كود العبقري الموحد")


class SubmitAnswerDTO(BaseModel):
    learner_id: str = Field(..., example="ICSHD-2026-89B2")
    session_id: str = Field(..., example="sess_001")
    answer: str = Field(..., example="15")
    duration_ms: int = Field(..., example=4500, ge=0)


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_session(payload: StartSessionDTO, engine=Depends(get_engine)) -> Dict[str, Any]:
    """بدء جلسة تعلم جديدة للعبقري وتهيئة حسابات القدرة المبدئية (Theta)."""
    try:
        return engine.start_learning_use_case.execute(learner_id=payload.learner_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في بدء الجلسة التكيفية: {str(err)}",
        )


@router.post("/submit", status_code=status.HTTP_200_OK)
def submit_answer(payload: SubmitAnswerDTO, engine=Depends(get_engine)) -> Dict[str, Any]:
    """حساب القدرة الحقيقية (Theta) وتحديث خطأ القياس Standard Error بناءً على نموذج IRT."""
    try:
        request_dto = SubmitAnswerRequest(
            learner_id=payload.learner_id,
            session_id=payload.session_id,
            answer=payload.answer,
            duration_ms=payload.duration_ms,
        )
        return engine.submit_answer_use_case.execute(request_dto)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في معالجة الإجابة: {str(err)}",
        )


@router.get("/generate-soroban", status_code=status.HTTP_200_OK)
def get_dynamic_soroban_question(
    level: SorobanLevelEnum = Query(
        SorobanLevelEnum.MIXED, description="مستوى المسألة (S, F5, F10, MIX)"
    ),
    digits: int = Query(1, ge=1, le=5, description="عدد الخانات (من 1 إلى 5 خانات)"),
    rows: int = Query(3, ge=2, le=50, description="عدد الصفوف (من 2 إلى 50 صفاً)"),
) -> Dict[str, Any]:
    """توليد مسألة سوروبان ديناميكية لا متناهية بدون أرقام أو نواتج سالبة."""
    try:
        problem = SorobanGenerator.generate_problem(
            level=level.value, digits_count=digits, rows_count=rows
        )
        # إرفاق المؤقت المركزي المحمي المُحدد من لوحة الإدارة حصراً
        problem["timer_seconds"] = SYSTEM_CONFIG.get("timer_seconds", 60)
        return problem
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ أثناء توليد مسألة السوروبان: {str(err)}",
        )