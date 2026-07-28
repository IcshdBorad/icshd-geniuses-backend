from fastapi import APIRouter, HTTPException, status
from core.application.use_cases.create_session import CreateSessionUseCase

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_session(data: dict):
    try:
        use_case = CreateSessionUseCase()
        result = await use_case.execute(data)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )