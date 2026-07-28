from __future__ import annotations

import logging
from typing import Dict, Any
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# استيراد الـ Routers المتخصصة للتدريب والتحليلات والبطولات
from core.presentation.api.routers import adaptive, analytics, challenges

# إعداد السجلات (Logging) للمتابعة والتشخيص
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ICSHD_API")

# إنشاء تطبيق FastAPI مع التوثيق الشامل
app = FastAPI(
    title="ICSHD Adaptive Learning & Analytics Platform API",
    version="2.0.0",
    description=(
        "Enterprise-grade Adaptive Learning Platform driven by Item Response Theory (IRT).\n\n"
        "**Core Capabilities:**\n"
        "* **Adaptive Engine**: Dynamic item selection & real-time ability (θ) estimation.\n"
        "* **Learner Analytics**: Progress tracking, skill mastery, and diagnostic recommendations.\n"
        "* **Gamification & Challenges**: Fair tournament matchmaking based on skill brackets."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# تفعيل إعدادات CORS للسماح بالربط مع لوحات التحكم والموبايل (Front-end Solutions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يمكن تقييدها بـ domain الواجهة في الإنتاج
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# معالج استثناءات عام لضمان استجابة موحدة للخدمة في حال حدوث أي خطأ غير متوقع
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled system error: {str(exc)} on path {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An internal system error occurred. Please try again later.",
            "detail": str(exc),
        },
    )

# تسجيل الـ Routers المستقلة بأسماء ومجموعات واضحة
app.include_router(adaptive.router)
app.include_router(analytics.router)
app.include_router(challenges.router)

# نقطة اتصال جذرية للتحقق من سلامة الخدمة (Health Check)
@app.get("/", tags=["Health & Status"])
def health_check() -> Dict[str, Any]:
    return {
        "status": "online",
        "system": "ICSHD Adaptive Engine Core",
        "version": "2.0.0",
        "docs": "/docs",
    }