from __future__ import annotations

from dataclasses import dataclass

# ==========================================================
# Ports
# ==========================================================

from core.application.ports.attempt_repository import AttemptRepository
from core.application.ports.clock import Clock
from core.application.ports.learner_repository import LearnerRepository
from core.application.ports.question_repository import QuestionRepository
from core.application.ports.session_repository import SessionRepository
from core.application.ports.skill_repository import SkillRepository
from core.application.ports.unit_of_work import UnitOfWork

# ==========================================================
# Domain & Adaptive Services
# ==========================================================

from core.domain.adaptive.forgetting_curve import ForgettingCurve
from core.services.learning_path import LearningPath
from core.services.question_selector import QuestionSelector
from core.services.skill_priority import SkillPriority
from core.services.skill_progress_tracker import SkillProgressTracker
from core.services.skill_selector import SkillSelector
from core.services.spaced_repetition import SpacedRepetition

# ==========================================================
# Learning Services
# ==========================================================

from core.services.learning.answer_validator import AnswerValidator
from core.services.learning.attempt_factory import AttemptFactory
from core.services.learning.learner_progress_updater import LearnerProgressUpdater
from core.services.learning.next_question_pipeline import NextQuestionPipeline
from core.services.learning.recommendation_pipeline import RecommendationPipeline
from core.services.learning.session_finalizer import SessionFinalizer

# ==========================================================
# Application Services & Facade
# ==========================================================

from core.application.services.learning_engine import LearningEngine

# ==========================================================
# Use Cases
# ==========================================================

from core.application.use_cases.get_learner_dashboard import GetLearnerDashboardUseCase
from core.application.use_cases.get_next_question import GetNextQuestionUseCase
from core.application.use_cases.get_review_questions import GetReviewQuestionsUseCase
from core.application.use_cases.reset_progress import ResetProgressUseCase
from core.application.use_cases.start_learning_session import StartLearningSessionUseCase
from core.application.use_cases.submit_answer import SubmitAnswerUseCase


@dataclass(slots=True)
class Application:
    """
    Root application object.
    """

    engine: LearningEngine


def bootstrap(
    *,
    learners: LearnerRepository,
    sessions: SessionRepository,
    questions: QuestionRepository,
    skills: SkillRepository,
    attempts: AttemptRepository,
    unit_of_work: UnitOfWork,
    clock: Clock,
) -> Application:

    # ======================================================
    # Domain Services
    # ======================================================

    spaced_repetition = SpacedRepetition(clock=clock)
    skill_priority = SkillPriority()
    progress_tracker = SkillProgressTracker()
    learning_path = LearningPath()
    
    # ForgettingCurve يحتاج إلى clock لحساب الفترات الزمانية
    forgetting_curve = ForgettingCurve(clock=clock)

    skill_selector = SkillSelector(
        skill_priority=skill_priority,
        learning_path=learning_path,
        forgetting_curve=forgetting_curve,
    )
    
    # QuestionSelector لا يتطلب أي وسائط أثناء الإنشاء
    question_selector = QuestionSelector()

    # ======================================================
    # Learning Services
    # ======================================================

    answer_validator = AnswerValidator()

    attempt_factory = AttemptFactory(
        attempts=attempts,
        spaced_repetition=spaced_repetition,
        clock=clock,
    )

    learner_progress_updater = LearnerProgressUpdater(
        skill_progress_tracker=progress_tracker,
    )

    recommendation_pipeline = RecommendationPipeline()

    next_question_pipeline = NextQuestionPipeline(
        skill_selector=skill_selector,
        question_selector=question_selector,
    )

    session_finalizer = SessionFinalizer(
        learners=learners,
        sessions=sessions,
    )

    # ======================================================
    # Use Cases
    # ======================================================

    start_learning_use_case = StartLearningSessionUseCase(
        learners=learners,
        sessions=sessions,
        skills=skills,
        questions=questions,
        attempts=attempts,
        next_question_pipeline=next_question_pipeline,
        clock=clock,
    )

    submit_answer_use_case = SubmitAnswerUseCase(
        learners=learners,
        sessions=sessions,
        questions=questions,
        skills=skills,
        attempts=attempts,
        unit_of_work=unit_of_work,
        answer_validator=answer_validator,
        attempt_factory=attempt_factory,
        learner_progress_updater=learner_progress_updater,
        recommendation_pipeline=recommendation_pipeline,
        next_question_pipeline=next_question_pipeline,
        session_finalizer=session_finalizer,
    )

    next_question_use_case = GetNextQuestionUseCase(
        learners=learners,
        sessions=sessions,
        skills=skills,
        questions=questions,
        attempts=attempts,
        next_question_pipeline=next_question_pipeline,
    )

    review_questions_use_case = GetReviewQuestionsUseCase(
        learners=learners,
        attempts=attempts,
        questions=questions,
        spaced_repetition=spaced_repetition,
    )

    learner_dashboard_use_case = GetLearnerDashboardUseCase(
        learners=learners,
        attempts=attempts,
    )

    reset_progress_use_case = ResetProgressUseCase(
        learners=learners,
        attempts=attempts,
        sessions=sessions,
        progress_tracker=progress_tracker,
    )

    # ======================================================
    # Application Facade
    # ======================================================

    engine = LearningEngine(
        start_learning_use_case=start_learning_use_case,
        submit_answer_use_case=submit_answer_use_case,
        next_question_use_case=next_question_use_case,
        review_questions_use_case=review_questions_use_case,
        learner_dashboard_use_case=learner_dashboard_use_case,
        reset_progress_use_case=reset_progress_use_case,
    )

    return Application(engine=engine)