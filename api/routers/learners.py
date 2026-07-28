from fastapi import APIRouter, HTTPException, status
from core.application.use_cases.reset_progress import ResetProgressUseCase

router = APIRouter(
    prefix="/learners",
    tags=["Learners"]
)


@router.delete("/{learner_id}/progress", status_code=status.HTTP_200_OK)
async def reset_learner_progress(learner_id: str):
    try:
        use_case = ResetProgressUseCase()
        result = await use_case.execute(learner_id=learner_id)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )