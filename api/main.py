from fastapi import FastAPI
from api.routers import learners, dashboard, sessions

app = FastAPI(
    title="ICSHD Adaptive Learning Platform API",
    version="1.0.0"
)

app.include_router(learners.router)
app.include_router(dashboard.router)
app.include_router(sessions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ICSHD API"}