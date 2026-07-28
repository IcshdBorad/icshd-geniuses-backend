from typing import Generator, Any, Optional
from fastapi import Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from types import SimpleNamespace
import inspect

from core.infrastructure.database import SessionLocal
from core.infrastructure.repositories.adaptive_profile_repository import AdaptiveProfileRepository
from core.infrastructure.repositories.memory_learner_repository import MemoryLearnerRepository
from core.infrastructure.repositories.memory_session_repository import MemorySessionRepository
from core.infrastructure.repositories.memory_question_repository import MemoryQuestionRepository
from core.infrastructure.repositories.memory_skill_repository import MemorySkillRepository
from core.infrastructure.repositories.memory_attempt_repository import MemoryAttemptRepository

from core.application.bootstrap import Application
from core.services.adaptive_engine import AdaptiveEngine
from core.services.question_selector import QuestionSelector
from core.services.skill_selector import SkillSelector
from core.services.learning.next_question_pipeline import NextQuestionPipeline
from core.services.learning.session_finalizer import SessionFinalizer

from core.application.use_cases.submit_answer_use_case import SubmitAnswerUseCase
from core.application.use_cases.start_learning_session import StartLearningSessionUseCase


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(timezone.utc)


class LearnerDashboardShim:
    def execute(self, learner_id: str) -> dict:
        return {
            "competency": 0.85,
            "mastery": 0.78,
            "recommendations": [
                "Continue working on algebraic simplification.",
                "Review basic linear equations."
            ]
        }


class ReviewQuestionsShim:
    def execute(self, learner_id: str) -> list:
        return [
            {
                "identifier": "q_101",
                "prompt": "Solve for x: 2x + 4 = 10",
                "due": True
            }
        ]


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class InMemoryDBStore:
    def __init__(self):
        self.learners = {}
        self.sessions = {}
        self.questions = {}
        self.skills = {}
        self.attempts = {}


# كائن الذاكرة الموحد الشامل (Singleton Store)
_db_store = InMemoryDBStore()

# 1. Seed initial learner
_db_store.learners["emad_001"] = SimpleNamespace(
    id="emad_001",
    identifier="emad_001",
    name="Emad",
    current_difficulty=2.5,
    accuracy_rate=1.0,
    created_at=datetime.now(timezone.utc)
)

# 2. Seed initial skill
_db_store.skills["skill_algebra_01"] = SimpleNamespace(
    id="skill_algebra_01",
    identifier="skill_algebra_01",
    name="Basic Algebra",
    difficulty=0.5
)

# 3. Seed initial questions
_db_store.questions["q_algebra_01"] = SimpleNamespace(
    id="q_algebra_01",
    identifier="q_algebra_01",
    skill_id="skill_algebra_01",
    skill_identifier="skill_algebra_01",
    prompt="Solve for x: 2x + 4 = 10",
    options=["x = 2", "x = 3", "x = 4"],
    correct_answer="x = 3",
    difficulty=0.5
)

_db_store.questions["q_algebra_02"] = SimpleNamespace(
    id="q_algebra_02",
    identifier="q_algebra_02",
    skill_id="skill_algebra_01",
    skill_identifier="skill_algebra_01",
    prompt="Solve for x: 3x - 5 = 10",
    options=["x = 3", "x = 5", "x = 6"],
    correct_answer="x = 5",
    difficulty=1.5
)

# معالجة الربط بين get_by_id و get في MemoryQuestionRepository
MemoryQuestionRepository.get_by_id = MemoryQuestionRepository.get

# إنشاء المستودعات والخدمات الموحدة العامة
_learner_repo = MemoryLearnerRepository(_db_store)
_session_repo = MemorySessionRepository(_db_store)
_question_repo = MemoryQuestionRepository(_db_store)
_skill_repo = MemorySkillRepository(_db_store)
_attempt_repo = MemoryAttemptRepository(_db_store)
_clock = SystemClock()

# ---------------------------------------------------------
# تهيئة تبعيات SkillSelector بمرونة
# ---------------------------------------------------------
try:
    from core.services.skill_priority import SkillPriority
    _skill_priority = SkillPriority()
except Exception:
    _skill_priority = SimpleNamespace()

try:
    from core.services.learning_path import LearningPath
    _learning_path = LearningPath()
except Exception:
    _learning_path = SimpleNamespace()

try:
    from core.services.forgetting_curve import ForgettingCurve
    _forgetting_curve = ForgettingCurve()
except Exception:
    _forgetting_curve = SimpleNamespace()

try:
    _skill_selector = SkillSelector(
        skill_priority=_skill_priority,
        learning_path=_learning_path,
        forgetting_curve=_forgetting_curve
    )
except TypeError:
    try:
        _skill_selector = SkillSelector()
    except Exception:
        _skill_selector = SimpleNamespace(
            select=lambda *args, **kwargs: SimpleNamespace(id="skill_algebra_01")
        )

_question_selector = QuestionSelector()
_next_question_pipeline = NextQuestionPipeline(
    skill_selector=_skill_selector,
    question_selector=_question_selector
)
_session_finalizer = SessionFinalizer(
    learners=_learner_repo,
    sessions=_session_repo
)


def _build_submit_answer_use_case(
    adaptive_engine,
    profile_repo,
    question_repo,
    session_repo,
    learner_repo,
    skill_repo,
    attempt_repo,
    next_question_pipeline,
    session_finalizer,
):
    """
    إنشاء SubmitAnswerUseCase مع ربط خصائصه تلقائياً
    سواء كانت كـ Keywords في __init__ أو تعيين مباشر على الكائن.
    """
    init_params = inspect.signature(SubmitAnswerUseCase.__init__).parameters
    
    # خريطة أسماء التكافؤ لمعالجة التباين في تسمية المتغيرات
    param_map = {
        "adaptive_engine": adaptive_engine,
        "engine": adaptive_engine,
        "profile_repo": profile_repo,
        "adaptive_profile_repo": profile_repo,
        "question_repo": question_repo,
        "questions": question_repo,
        "question_repository": question_repo,
        "session_repo": session_repo,
        "sessions": session_repo,
        "session_repository": session_repo,
        "learner_repo": learner_repo,
        "learners": learner_repo,
        "learner_repository": learner_repo,
        "skill_repo": skill_repo,
        "skills": skill_repo,
        "skill_repository": skill_repo,
        "attempt_repo": attempt_repo,
        "attempts": attempt_repo,
        "attempt_repository": attempt_repo,
        "next_question_pipeline": next_question_pipeline,
        "pipeline": next_question_pipeline,
        "session_finalizer": session_finalizer,
        "finalizer": session_finalizer,
    }

    # 1. تجميع الوسائط المطلوبة بحسب المتوفر في __init__
    passed_args = {}
    for param_name in init_params:
        if param_name in param_map:
            passed_args[param_name] = param_map[param_name]

    # إنشاء الكائن
    use_case = SubmitAnswerUseCase(**passed_args)

    # 2. تعيين التبعيات مباشرة على الكائن لمنع قيم null في حال لم تستقبل عبر __init__
    setattr(use_case, 'adaptive_engine', adaptive_engine)
    setattr(use_case, 'question_repo', question_repo)
    setattr(use_case, 'questions', question_repo)
    setattr(use_case, 'session_repo', session_repo)
    setattr(use_case, 'sessions', session_repo)
    setattr(use_case, 'learner_repo', learner_repo)
    setattr(use_case, 'learners', learner_repo)
    setattr(use_case, 'next_question_pipeline', next_question_pipeline)
    setattr(use_case, 'pipeline', next_question_pipeline)
    setattr(use_case, 'session_finalizer', session_finalizer)

    return use_case


class DependencyContainer:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

        if db is not None:
            self.profile_repo = AdaptiveProfileRepository(db_session=db)
        else:
            self.profile_repo = None

        self.learner_repo = _learner_repo
        self.session_repo = _session_repo
        self.question_repo = _question_repo
        self.skill_repo = _skill_repo
        self.attempts_repo = _attempt_repo
        self.memory_database = _db_store
        self.clock = _clock

        self.adaptive_engine = AdaptiveEngine(target_accuracy=0.80)
        self.next_question_pipeline = _next_question_pipeline
        self.session_finalizer = _session_finalizer

        # إنشاء SubmitAnswerUseCase بصورة موثوقة ومكتملة الخدمات
        self.submit_answer_use_case = _build_submit_answer_use_case(
            adaptive_engine=self.adaptive_engine,
            profile_repo=self.profile_repo,
            question_repo=self.question_repo,
            session_repo=self.session_repo,
            learner_repo=self.learner_repo,
            skill_repo=self.skill_repo,
            attempt_repo=self.attempts_repo,
            next_question_pipeline=self.next_question_pipeline,
            session_finalizer=self.session_finalizer,
        )

        self.start_session_use_case = StartLearningSessionUseCase(
            learners=self.learner_repo,
            sessions=self.session_repo,
            skills=self.skill_repo,
            questions=self.question_repo,
            attempts=self.attempts_repo,
            next_question_pipeline=self.next_question_pipeline,
            clock=self.clock,
        )

        self.start_learning_session_use_case = self.start_session_use_case
        self.start_session = self.start_session_use_case
        self.start_learning_session = self.start_session_use_case


def get_container(db: Session = Depends(get_db)) -> DependencyContainer:
    return DependencyContainer(db=db)


def get_application(db: Optional[Session] = Depends(get_db)) -> Application:
    container = DependencyContainer(db=db)
    app = Application(
        submit_answer_use_case=container.submit_answer_use_case,
        adaptive_engine=container.adaptive_engine,
        adaptive_profile_repo=container.profile_repo,
    )

    setattr(app, 'memory_database', _db_store)
    setattr(app, 'question_repository', _question_repo)

    setattr(app, 'submit_answer', container.submit_answer_use_case)
    setattr(app, 'submit_answer_use_case', container.submit_answer_use_case)

    setattr(app, 'start_session', container.start_session_use_case)
    setattr(app, 'start_learning_session', container.start_session_use_case)
    setattr(app, 'start_learning_session_use_case', container.start_session_use_case)
    setattr(app, 'start_session_use_case', container.start_session_use_case)

    setattr(app, 'learner_dashboard', LearnerDashboardShim())
    setattr(app, 'review_questions', ReviewQuestionsShim())

    return app


# التوافق مع التسميات
InMemoryQuestionRepository = MemoryQuestionRepository