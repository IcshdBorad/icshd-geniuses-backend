from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
)

from api.dependencies import (
    get_application,
)

from api.schemas.review import (
    ReviewQuestionResponse,
)

from core.application.bootstrap import (
    Application,
)


router = APIRouter(
    prefix="/review",
    tags=["Review"],
)


@router.get(
    "/{learner_id}",
    response_model=list[ReviewQuestionResponse],
)
def review_questions(
    learner_id: str,
    application: Application = Depends(
        get_application,
    ),
):

    result = (
        application.review_questions.execute(
            learner_id,
        )
    )

    return [
        ReviewQuestionResponse.model_validate(
            question,
        )
        for question in result
    ]