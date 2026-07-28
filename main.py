from __future__ import annotations

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.routers.sessions import router as sessions_router
from api.routers.answers import router as answers_router
from api.routers.dashboard import router as dashboard_router
from api.routers.review import router as review_router
from api.routers.learners import router as learners_router


def create_application() -> FastAPI:
    """
    إعداد وإنشاء تطبيق FastAPI لمنصة Mizan Math التكيفية.
    """

    app = FastAPI(
        title="ICSHD Adaptive Learning Platform",
        version="1.0.0",
        description=(
            "Adaptive Learning Platform based on "
            "Competency, Mastery and Spaced Repetition."
        ),
    )

    # 1. تسجيل الموجّهات (Routers)
    app.include_router(sessions_router)
    app.include_router(answers_router)
    app.include_router(dashboard_router)
    app.include_router(review_router)
    app.include_router(learners_router)

    # 2. ربط مجلد الملفات الثابتة
    app.mount("/static", StaticFiles(directory="public"), name="static")

    # 3. توجيه المسار الرئيسي إلى الواجهة الأمامية مباشرة
    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse("public/index.html")

    return app


app = create_application()