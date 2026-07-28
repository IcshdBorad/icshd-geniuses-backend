from fastapi import APIRouter

from core.services.service_container import learning_service as service
from packages.contracts.attempt import Attempt

router = APIRouter()


@router.get("/attempts")
def list_attempts():
    return service.attempts.list()


@router.post("/attempts")
def create_attempt(attempt: Attempt):
    service.attempts.save(attempt)
    return {"message": "Attempt created"}