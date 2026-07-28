from __future__ import annotations

# DTOs
from core.application.dto.submit_answer_request import SubmitAnswerRequest
from core.application.dto.submit_answer_response import SubmitAnswerResponse

# Ports
from core.application.ports.attempt_repository import AttemptRepository
from core.application.ports.learner_repository import LearnerRepository
from core.application.ports.question_repository import QuestionRepository
from core.application.ports.session_repository import SessionRepository
from core.application.ports.skill_repository import SkillRepository
from core.application.ports.unit_of_work import UnitOfWork

# Learning Services
from core.services.learning.answer_validator import AnswerValidator
from core.services.learning.attempt_factory import AttemptFactory
from core.services.learning.learner_progress_updater import LearnerProgressUpdater
from core.services.learning.next_question_pipeline import NextQuestionPipeline
from core.services.learning.recommendation_pipeline import RecommendationPipeline
from core.services.learning.session_finalizer import SessionFinalizer

# Domain Contracts
from packages.contracts.learner import Learner
from packages.contracts.learning_session import LearningSession
from packages.contracts.question import Question


class SubmitAnswerUseCase:
    """
    Executes the complete adaptive learning workflow after
    the learner submits an answer.
    """

    def __init__(
        self,
        learners: LearnerRepository,
        sessions: SessionRepository,
        questions: QuestionRepository,
        skills: SkillRepository,
        attempts: AttemptRepository,
        unit_of_work: UnitOfWork,
        answer_validator: AnswerValidator,
        attempt_factory: AttemptFactory,
        learner_progress_updater: LearnerProgressUpdater,
        recommendation_pipeline: RecommendationPipeline,
        next_question_pipeline: NextQuestionPipeline,
        session_finalizer: SessionFinalizer,
    ) -> None:
        self._learners = learners
        self._sessions = sessions
        self._questions = questions
        self._skills = skills
        self._attempts = attempts
        self._uow = unit_of_work
        self._answer_validator = answer_validator
        self._attempt_factory = attempt_factory
        self._learner_progress_updater = learner_progress_updater
        self._recommendation_pipeline = recommendation_pipeline
        self._next_question_pipeline = next_question_pipeline
        self._session_finalizer = session_finalizer

    def execute(
        self,
        request: SubmitAnswerRequest,
    ) -> SubmitAnswerResponse:
        with self._uow:
            learner = self._load_learner(request.learner_id)
            session = self._load_session(request.session_id)
            question = self._load_current_question(session, request)

            validation = self._answer_validator.validate(
                question=question,
                request=request,
            )

            attempt = self._attempt_factory.create(
                learner=learner,
                session=session,
                question=question,
                request=request,
                validation=validation,
            )

            self._attempts.save(attempt)

            progress = self._learner_progress_updater.update(
                learner=learner,
                session=session,
                question=question,
                attempt=attempt,
            )

            self._recommendation_pipeline.execute(
                learner=learner,
                progress=progress,
            )

            next_step = self._next_question_pipeline.execute(
                learner=learner,
                session=session,
                skills=self._skills.list(),
                questions=self._questions.list(),
                attempts=self._attempts.list_by_learner(
                    learner.identifier,
                ),
            )

            # إنهاء الجلسة وبناء الاستجابة
            response = self._session_finalizer.finalize(
                learner=learner,
                session=session,
                question=question,
                is_correct=validation.is_correct,
                score=validation.score,
                next_question=next_step.question,
            )

            # ضمان إرجاع الإجابة الصحيحة للنص في الـ Response
            if hasattr(response, "correct_answer") and response.correct_answer is None:
                response.correct_answer = getattr(question, "answer", None)

            # تحديث معرف السؤال التالي في الجلسة لمواصلة التدفق التكيفي
            if next_step.question:
                session.current_question_id = next_step.question.identifier
                self._sessions.save(session)

            self._uow.commit()
            return response

    def _load_learner(self, learner_id: str) -> Learner:
        learner = self._learners.get(learner_id)
        if learner is None:
            raise ValueError(f"Learner '{learner_id}' not found.")
        return learner

    def _load_session(self, session_id: str) -> LearningSession:
        session = self._sessions.get(session_id)
        if session is None:
            raise ValueError(f"Session '{session_id}' not found.")
        return session

    def _load_current_question(self, session: LearningSession, request: SubmitAnswerRequest) -> Question:
        # جلب معرف السؤال من الجلسة أو من كائن الطلب المباشر (Fallback)
        question_id = getattr(session, "current_question_id", None) or getattr(request, "question_id", None)

        if not question_id:
            raise ValueError("Learning session has no current question.")

        question = self._questions.get(question_id)
        if question is None:
            raise ValueError(f"Current question '{question_id}' not found.")

        return question