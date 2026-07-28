from fastapi import APIRouter

from core.services.service_container import learning_service as service
from packages.contracts.skill import Skill

router = APIRouter()


@router.get("/skills")
def list_skills():
    return service.list_skills()


@router.post("/skills")
def create_skill(skill: Skill):
    service.add_skill(skill)
    return {"message": "Skill created"}