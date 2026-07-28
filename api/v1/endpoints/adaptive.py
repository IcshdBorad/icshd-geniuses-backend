import asyncio
import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from core.database import get_postgres, get_redis
from core.services.irt_engine import AdaptiveIRTEngine, ABILITY_MIN, ABILITY_MAX
from core.application.use_cases.adaptive_session import (
    AdaptiveSessionUseCase,
    SubmitAnswerRequest,
    QuestionDTO,
)

logger = logging.getLogger("adaptive_engine")
router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning Engine"])


# ==========================================
# Pydantic Schemas للـ REST & WebSocket API
# ==========================================
class QuestionSchema(BaseModel):
    id: str
    difficulty: float
    discrimination: float = 1.0


class AttemptRequest(BaseModel):
    learner_id: str
    session_id: str
    question_id: str
    is_correct: bool
    response_time_ms: float = Field(default=1500.0, gt=0)


class AdaptiveResponse(BaseModel):
    learner_id: str
    session_id: str
    previous_theta: float
    new_theta: float
    next_question: Optional[QuestionSchema] = None


# ==========================================
# Adapters مؤقتة للـ Infrastructure Protocols
# ==========================================
class AsyncPostgresQuestionRepo:
    """مستقبل جلب الأسئلة من Neon PostgreSQL"""
    async def get_by_id(self, question_id: str) -> Optional[QuestionDTO]:
        # يمكن استبدالها بجلب حقيقي من قاعدة البيانات
        return QuestionDTO(id=question_id, difficulty=0.0, discrimination=1.0)

    async def get_candidate_questions(
        self, student_id: str, exclude_ids: List[str]
    ) -> List[QuestionDTO]:
        # محاكاة بنك الأسئلة المتاحة
        all_questions = [
            QuestionDTO(id="q_easy", difficulty=-1.5, discrimination=1.0),
            QuestionDTO(id="q_medium", difficulty=0.2, discrimination=1.2),
            QuestionDTO(id="q_hard", difficulty=1.8, discrimination=1.5),
        ]
        return [q for q in all_questions if q.id not in exclude_ids]


class AsyncRedisSessionRepo:
    """مستقبل إدارة الجلسة والـ Theta عبر Upstash Redis"""
    async def get_student_theta(self, student_id: str, session_id: str) -> float:
        try:
            redis_db = get_redis()
            val = await redis_db.hget(f"session:{session_id}", "theta")
            return float(val) if val else 0.0
        except Exception as e:
            logger.warning(f"⚠️ فشل جلب Theta من Redis: {e}")
            return 0.0

    async def update_student_theta(
        self, student_id: str, session_id: str, new_theta: float
    ) -> None:
        try:
            redis_db = get_redis()
            session_key = f"session:{session_id}"
            await redis_db.hset(session_key, "theta", new_theta)
            await redis_db.expire(session_key, 3600)
        except Exception as e:
            logger.warning(f"⚠️ فشل تحديث Theta في Redis: {e}")

    async def get_answered_question_ids(self, session_id: str) -> List[str]:
        try:
            redis_db = get_redis()
            ids = await redis_db.smembers(f"session:{session_id}:answered")
            return [i.decode('utf-8') if isinstance(i, bytes) else str(i) for i in ids]
        except Exception:
            return []

    async def record_response(
        self, session_id: str, question_id: str, is_correct: bool
    ) -> None:
        try:
            redis_db = get_redis()
            await redis_db.sadd(f"session:{session_id}:answered", question_id)
        except Exception as e:
            logger.warning(f"⚠️ فشل تسجيل الإجابة في Redis: {e}")


# ==========================================
# Dependency Injection Container
# ==========================================
def get_adaptive_use_case() -> AdaptiveSessionUseCase:
    return AdaptiveSessionUseCase(
        irt_engine=AdaptiveIRTEngine(),
        question_repo=AsyncPostgresQuestionRepo(),
        session_repo=AsyncRedisSessionRepo(),
    )


async def _save_attempt_to_postgres(
    learner_id: str,
    session_id: str,
    question_id: str,
    is_correct: bool,
    response_time_ms: float,
    new_theta: float,
):
    """حفظ المحاولة في Neon PostgreSQL في الخلفية دون إعاقة الاستجابة"""
    try:
        pg_pool = get_postgres()
        async with pg_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO learner_attempts (learner_id, session_id, question_id, is_correct, response_time_ms, theta, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                """,
                learner_id,
                session_id,
                question_id,
                is_correct,
                response_time_ms,
                new_theta,
            )
    except Exception as e:
        logger.error(f"⚠️ فشل حفظ المحاولة في PostgreSQL: {e}")


# ==========================================
# REST API Endpoint
# ==========================================
@router.post("/process-attempt", response_model=AdaptiveResponse)
async def process_learner_attempt(
    payload: AttemptRequest,
    use_case: AdaptiveSessionUseCase = Depends(get_adaptive_use_case),
):
    """استقبال أداء المتعلم لحظياً وملاءمة الصعوبة بـ IRT 2PL وتخزين النتائج"""
    try:
        request = SubmitAnswerRequest(
            student_id=payload.learner_id,
            session_id=payload.session_id,
            question_id=payload.question_id,
            is_correct=payload.is_correct,
        )
        
        response = await use_case.process_answer_and_get_next(request)

        # حفظ سجل المحاولة في الخلفية
        asyncio.create_task(
            _save_attempt_to_postgres(
                learner_id=response.student_id,
                session_id=payload.session_id,
                question_id=payload.question_id,
                is_correct=payload.is_correct,
                response_time_ms=payload.response_time_ms,
                new_theta=response.new_theta,
            )
        )

        next_q = None
        if response.next_question:
            next_q = QuestionSchema(
                id=response.next_question.id,
                difficulty=response.next_question.difficulty,
                discrimination=response.next_question.discrimination,
            )

        return AdaptiveResponse(
            learner_id=response.student_id,
            session_id=payload.session_id,
            previous_theta=response.previous_theta,
            new_theta=response.new_theta,
            next_question=next_q,
        )
    except Exception as e:
        logger.error(f"خطأ في معالجة المحاولة عبر REST: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# WebSocket Endpoint (Canvas Hyper-Mental Flow)
# ==========================================
@router.websocket("/ws/flow")
async def websocket_flow_endpoint(
    websocket: WebSocket,
    use_case: AdaptiveSessionUseCase = Depends(get_adaptive_use_case),
):
    """اتصال WebSocket لحظي لتحديث قدرة الطالب وتوجيه Canvas UI بـ IRT Engine"""
    await websocket.accept()
    logger.info("🧠 تم فتح اتصال Canvas WebSocket بنجاح")

    session_id = "ws_session_canvas"
    learner_id = "canvas_user"

    try:
        while True:
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({"status": "error", "message": "Invalid JSON format"})
                continue

            request = SubmitAnswerRequest(
                student_id=learner_id,
                session_id=session_id,
                question_id=data.get("question_id", "q_medium"),
                is_correct=bool(data.get("is_correct", True)),
            )

            # تنفيذ المعالجة التكيفية باستخدام الـ UseCase
            response = await use_case.process_answer_and_get_next(request)

            # حفظ غير متزامن في DB
            asyncio.create_task(
                _save_attempt_to_postgres(
                    learner_id=learner_id,
                    session_id=session_id,
                    question_id=request.question_id,
                    is_correct=request.is_correct,
                    response_time_ms=float(data.get("response_time_ms", 1500.0)),
                    new_theta=response.new_theta,
                )
            )

            # تحويل Theta الممتد [-4.0, 4.0] إلى مقياس الشدة المئوي (0.1 إلى 1.0) للواجهات الرسومية
            normalized_intensity = round((response.new_theta - ABILITY_MIN) / (ABILITY_MAX - ABILITY_MIN), 2)

            response_payload = {
                "timestamp": data.get("timestamp"),
                "theta": response.new_theta,
                "intensity": max(0.1, min(1.0, normalized_intensity)),
                "flowVector": {
                    "x": round(normalized_intensity * 0.8, 2),
                    "y": round(normalized_intensity * -0.4, 2),
                },
                "next_question": {
                    "id": response.next_question.id,
                    "difficulty": response.next_question.difficulty,
                } if response.next_question else None,
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