from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter(
    prefix="/learners",
    tags=["Learners"]
)

# حاول استيراد الـ Use Case بأمان
try:
    from core.application.use_cases.reset_progress import ResetProgressUseCase
except ImportError:
    ResetProgressUseCase = None


# --- Schemas ---
class LearnerCreate(BaseModel):
    id: str
    name: str
    email: Optional[EmailStr] = None


class LearnerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class LearnerResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None


# --- In-Memory Repository ---
fake_learners_db: dict[str, dict] = {}


# --- Endpoints ---

@router.post("/", response_model=LearnerResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=LearnerResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_learner(payload: LearnerCreate):
    if payload.id in fake_learners_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Learner already exists"
        )
    
    learner_data = payload.model_dump()
    fake_learners_db[payload.id] = learner_data
    return learner_data


@router.get("/", response_model=List[LearnerResponse], status_code=status.HTTP_200_OK)
@router.get("", response_model=List[LearnerResponse], status_code=status.HTTP_200_OK, include_in_schema=False)
async def list_learners(skip: int = 0, limit: int = 10):
    learners = list(fake_learners_db.values())
    return learners[skip : skip + limit]


@router.get("/{learner_id}", response_model=LearnerResponse, status_code=status.HTTP_200_OK)
async def get_learner(learner_id: str):
    if learner_id not in fake_learners_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learner with ID {learner_id} not found"
        )
    return fake_learners_db[learner_id]


@router.put("/{learner_id}", response_model=LearnerResponse, status_code=status.HTTP_200_OK)
async def update_learner(learner_id: str, payload: LearnerUpdate):
    if learner_id not in fake_learners_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learner with ID {learner_id} not found"
        )
    
    stored_learner = fake_learners_db[learner_id]
    update_data = payload.model_dump(exclude_unset=True)
    stored_learner.update(update_data)
    fake_learners_db[learner_id] = stored_learner
    
    return stored_learner


@router.delete("/{learner_id}/progress", status_code=status.HTTP_200_OK)
async def reset_learner_progress(learner_id: str):
    if ResetProgressUseCase is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="ResetProgressUseCase is not implemented yet"
        )
    try:
        use_case = ResetProgressUseCase()
        result = await use_case.execute(learner_id=learner_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )