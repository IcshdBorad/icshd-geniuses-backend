import asyncio
import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from core.database import get_postgres, get_redis
from core.services.adaptive_engine import (
    AdaptiveEngine,
    AdaptiveProfile,
    PerformanceMetrics,
)

# إعداد السجلات (Logging) للمتابعة والتشخيص
logger = logging.getLogger("adaptive_engine")

router = APIRouter(prefix="/adaptive", tags=["Adaptive Engine"])
engine = AdaptiveEngine(target_accuracy=0.80)


# ==========================================
# Pydantic Schemas للـ REST API
# ==========================================
class AttemptRequest(BaseModel):
    learner_id: str
    path_id: str
    current_difficulty: float = Field(default=1.0, ge=1.0, le=10.0)
    is_correct: bool
    response_time_ms: float = Field(gt=0)
    expected_time_ms: float = 3000.0
    consecutive_correct: int = Field(default=0, ge=0)
    consecutive_incorrect: int = Field(default=0, ge=0)


class AdaptiveResponse(BaseModel):
    learner_id: str
    new_difficulty: float
    consecutive_correct: int
    consecutive_incorrect: int


# ==========================================
# دالة مساعدة للحفظ في قاعدة البيانات (Background Task)
# ==========================================
async def _save_attempt_to_postgres(
    learner_id: str,
    path_id: str,
    is_correct: bool,
    response_time_ms: float,
    difficulty: float,
):
    """تخزين السجل في Neon PostgreSQL في الخلفية دون تعطيل الـ Loop"""
    try:
        pg_pool = get_postgres()
        async with pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO learner_attempts (learner_id, is_correct, response_time_ms, difficulty, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                """,
                learner_id,
                is_correct,
                response_time_ms,
                difficulty,
            )
    except Exception as e:
        logger.error(f"⚠️ فشل حفظ المحاولة في PostgreSQL: {e}")


# ==========================================
# REST API Endpoints
# ==========================================
@router.post("/process-attempt", response_model=AdaptiveResponse)
async def process_learner_attempt(payload: AttemptRequest):
    """استقبال أداء المتعلم لحظياً عبر REST وتعديل درجة الصعوبة وتخزين النتائج"""
    try:
        profile = AdaptiveProfile(
            learner_id=payload.learner_id,
            path_id=payload.path_id,
            current_difficulty=payload.current_difficulty,
            consecutive_correct=payload.consecutive_correct,
            consecutive_incorrect=payload.consecutive_incorrect,
        )

        metrics = PerformanceMetrics(
            is_correct=payload.is_correct,
            response_time_ms=payload.response_time_ms,
            expected_time_ms=payload.expected_time_ms,
        )

        updated_profile = engine.update_profile(profile, metrics)

        # 1. تحديث الـ Cache في Upstash Redis
        try:
            redis_db = get_redis()
            session_key = f"session:{updated_profile.learner_id}"
            await redis_db.hset(
                session_key,
                mapping={
                    "current_difficulty": updated_profile.current_difficulty,
                    "consecutive_correct": getattr(updated_profile, "consecutive_correct", 0),
                    "consecutive_incorrect": getattr(updated_profile, "consecutive_incorrect", 0),
                },
            )
            await redis_db.expire(session_key, 3600)
        except Exception as r_err:
            logger.warning(f"⚠️ فشل كتابة الكاش في Redis: {r_err}")

        # 2. حفظ المحاولة في Neon PostgreSQL بدون إعاقة الاستجابة
        asyncio.create_task(
            _save_attempt_to_postgres(
                learner_id=updated_profile.learner_id,
                path_id=updated_profile.path_id,
                is_correct=metrics.is_correct,
                response_time_ms=metrics.response_time_ms,
                difficulty=updated_profile.current_difficulty,
            )
        )

        return AdaptiveResponse(
            learner_id=updated_profile.learner_id,
            new_difficulty=updated_profile.current_difficulty,
            consecutive_correct=getattr(updated_profile, "consecutive_correct", 0),
            consecutive_incorrect=getattr(updated_profile, "consecutive_incorrect", 0),
        )
    except Exception as e:
        logger.error(f"خطأ في معالجة المحاولة عبر REST: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# WebSocket Endpoint (Hyper-Mental Flow)
# ==========================================
@router.websocket("/ws/flow")
async def websocket_flow_endpoint(websocket: WebSocket):
    """نقطة اتصال WebSocket لحظية لربط واجهة Canvas UI بمحرك التكيف والتخزين المزدوج"""
    await websocket.accept()
    logger.info("🧠 تم فتح اتصال Canvas WebSocket بنجاح")

    profile = AdaptiveProfile(
        learner_id="canvas_user",
        path_id="hyper_mental_flow",
        current_difficulty=2.0,
    )

    try:
        while True:
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({"status": "error", "message": "Invalid JSON format"})
                continue

            metrics = PerformanceMetrics(
                is_correct=bool(data.get("is_correct", True)),
                response_time_ms=float(data.get("response_time_ms", 1500.0)),
                expected_time_ms=float(data.get("expected_time_ms", 3000.0)),
            )

            # تحديث مستوى الصعوبة وحفظ الحالة للجلسة الحالية
            profile = engine.update_profile(profile, metrics)

            # --- الحفظ اللحظي المزدوج (Redis + PostgreSQL) ---
            try:
                # أ) تحديث سريع جداً في Upstash Redis للحالة الحية
                redis_db = get_redis()
                session_key = f"session:{profile.learner_id}"
                await redis_db.hset(
                    session_key,
                    mapping={
                        "current_difficulty": profile.current_difficulty,
                        "consecutive_correct": getattr(profile, "consecutive_correct", 0),
                        "consecutive_incorrect": getattr(profile, "consecutive_incorrect", 0),
                        "last_active": data.get("timestamp", 0),
                    },
                )
                await redis_db.expire(session_key, 3600)

                # ب) إرسال مهمة حفظ السجل إلى Neon PostgreSQL بشكل غير متزامن تماماً
                asyncio.create_task(
                    _save_attempt_to_postgres(
                        learner_id=profile.learner_id,
                        path_id=profile.path_id,
                        is_correct=metrics.is_correct,
                        response_time_ms=metrics.response_time_ms,
                        difficulty=profile.current_difficulty,
                    )
                )
            except Exception as db_err:
                logger.error(f"⚠️ خطأ أثناء التخزين اللحظي: {db_err}")

            # حساب شدة التدفق للرسوميات (0.1 إلى 1.0)
            flow_intensity = round(profile.current_difficulty / 10.0, 2)

            # تجهيز حزمة الاستجابة للـ Canvas
            response_payload = {
                "timestamp": data.get("timestamp"),
                "speed": round(profile.current_difficulty * 5.0, 2),
                "flowVector": {
                    "x": round(flow_intensity * 0.8, 2),
                    "y": round(flow_intensity * -0.4, 2),
                },
                "intensity": flow_intensity,
                "new_difficulty": profile.current_difficulty,
                "consecutive_correct": getattr(profile, "consecutive_correct", 0),
                "consecutive_incorrect": getattr(profile, "consecutive_incorrect", 0),
            }

            await websocket.send_json(response_payload)

    except WebSocketDisconnect:
        logger.info("🔌 تم قطع اتصال Canvas WebSocket بسلام")
    except Exception as e:
        logger.error(f"⚠️ خطأ غير متوقع في WebSocket: {e}")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass