from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from api.dependencies import (
    get_application,
)
from api.schemas.answer import (
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from core.application.bootstrap import (
    Application,
)
from core.application.use_cases.submit_answer_use_case import SubmitAnswerInput

router = APIRouter(
    prefix="/answers",
    tags=["Adaptive Learning"],
)


@router.post(
    "",
    response_model=SubmitAnswerResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit learner answer",
)
def submit_answer(
    request: SubmitAnswerRequest,
    application: Application = Depends(get_application),
) -> SubmitAnswerResponse:
    """
    Evaluate a learner's answer and yield the next adaptive question.
    """
    try:
        # استخراج القيم مع مراعاة مرونة التسميات (submitted_answer vs user_answer)
        user_ans = (
            getattr(request, "submitted_answer", None)
            or getattr(request, "user_answer", None)
            or ""
        )
        q_id = getattr(request, "question_id", None)
        r_time = getattr(request, "response_time_ms", 5000.0)

        # بناء مدخلات الـ Use Case
        input_data = SubmitAnswerInput(
            learner_id=request.learner_id,
            session_id=request.session_id,
            question_id=q_id,
            user_answer=user_ans,
            response_time_ms=r_time,
        )

        # تنفيذ منطق المحرك التكيفي
        result = application.submit_answer.execute(input_data)

        # تحويل واستعادة الـ Response Model
        if isinstance(result, dict):
            return SubmitAnswerResponse(**result)
            
        return SubmitAnswerResponse.model_validate(result)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while evaluating the answer: {str(exc)}",
        ) from exc