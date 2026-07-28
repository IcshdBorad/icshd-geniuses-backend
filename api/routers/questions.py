from fastapi import APIRouter

from core.services.service_container import learning_service as service
from packages.contracts.question import Question

router = APIRouter()


@router.get("/questions")
def list_questions():
    return service.list_questions()


@router.post("/questions")
def create_question(question: Question):
    service.add_question(question)
    return {"message": "Question created"}