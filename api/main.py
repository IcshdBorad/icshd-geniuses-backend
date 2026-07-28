from fastapi import FastAPI

from api.routers.dashboard import router as dashboard_router
from api.routers.learners import router as learners_router
from api.routers.sessions import router as sessions_router

app = FastAPI(
    title="ICSHD Adaptive Learning Platform API",
    version="1.0.0",
)

# تضمين الراوترات مع إضافة البادئة الموحدة /api/v1
app.include_router(learners_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to ICSHD API"}