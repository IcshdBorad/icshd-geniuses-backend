from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Protocol
from core.services.irt_engine import AdaptiveIRTEngine


@dataclass
class QuestionDTO:
    id: str
    difficulty: float
    discrimination: float = 1.0


@dataclass
class SubmitAnswerRequest:
    student_id: str
    session_id: str
    question_id: str
    is_correct: bool


@dataclass
class AdaptiveStepResponse:
    student_id: str
    previous_theta: float
    new_theta: float
    next_question: Optional[QuestionDTO]


class QuestionRepositoryProtocol(Protocol):
    async def get_by_id(self, question_id: str) -> Optional[QuestionDTO]:
        ...

    async def get_candidate_questions(
        self, student_id: str, exclude_ids: List[str]
    ) -> List[QuestionDTO]:
        ...


class SessionRepositoryProtocol(Protocol):
    async def get_student_theta(self, student_id: str, session_id: str) -> float:
        ...

    async def update_student_theta(
        self, student_id: str, session_id: str, new_theta: float
    ) -> None:
        ...

    async def get_answered_question_ids(self, session_id: str) -> List[str]:
        ...

    async def record_response(
        self, session_id: str, question_id: str, is_correct: bool
    ) -> None:
        ...


class AdaptiveSessionUseCase:
    """
    Application Use Case responsible for executing an adaptive learning step:
    1. Fetch current student state and question parameters.
    2. Process the answer via IRT Engine to update Theta.
    3. Select and return the next optimal question.
    """

    def __init__(
        self,
        irt_engine: AdaptiveIRTEngine,
        question_repo: QuestionRepositoryProtocol,
        session_repo: SessionRepositoryProtocol,
    ):
        self.irt_engine = irt_engine
        self.question_repo = question_repo
        self.session_repo = session_repo

    async def process_answer_and_get_next(
        self, request: SubmitAnswerRequest
    ) -> AdaptiveStepResponse:
        # 1. جلب السؤال الحالي المُنَفّذ
        question = await self.question_repo.get_by_id(request.question_id)
        if not question:
            raise ValueError(f"Question with ID {request.question_id} not found.")

        # 2. جلب قدرة الطالب الحالية
        current_theta = await self.session_repo.get_student_theta(
            request.student_id, request.session_id
        )

        # 3. تحديث القدرة بواسطة محرك الـ IRT
        new_theta = self.irt_engine.update_ability(
            current_theta=current_theta,
            question_difficulty=question.difficulty,
            discrimination=question.discrimination,
            is_correct=request.is_correct,
        )

        # 4. حفظ الإجابة والقدرة الجديدة
        await self.session_repo.record_response(
            request.session_id, request.question_id, request.is_correct
        )
        await self.session_repo.update_student_theta(
            request.student_id, request.session_id, new_theta
        )

        # 5. استخراج الأسئلة المستبعدة (التي أجاب عليها سابقاً)
        exclude_ids = await self.session_repo.get_answered_question_ids(request.session_id)

        # 6. ترشيح الأسئلة المتاحة واختيار السؤال الأنسب لقدرته الجديدة
        candidates = await self.question_repo.get_candidate_questions(
            request.student_id, exclude_ids
        )
        next_question = self.irt_engine.select_optimal_next_question(
            learner_theta=new_theta, candidate_questions=candidates
        )

        return AdaptiveStepResponse(
            student_id=request.student_id,
            previous_theta=current_theta,
            new_theta=new_theta,
            next_question=next_question,
        )