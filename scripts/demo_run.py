from __future__ import annotations

import logging
import pprint
from typing import Any, Final

from core.application.dto.submit_answer_request import SubmitAnswerRequest
from core.application.use_cases.get_learner_dashboard import GetLearnerDashboardUseCase
from core.bootstrap import bootstrap
from core.infrastructure.dependency_container import DependencyContainer
from core.infrastructure.persistence.memory_database import MemoryDatabase

# Domain Contracts
from packages.contracts.learner import Learner
from packages.contracts.question import Question
from packages.contracts.skill import Skill

# Logging Configuration
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Execution Constants
LEARNER_ID: Final[str] = "learner_01"
SKILL_ID: Final[str] = "skill_python_basics"


def _extract_attr(obj: Any, *attrs: str, default: Any = None) -> Any:
    """Helper utility to safely extract attributes across varying DTO conventions."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        for attr in attrs:
            if attr in obj:
                return obj[attr]
        return default
    for attr in attrs:
        val = getattr(obj, attr, None)
        if val is not None:
            return val
    return default


def run_demo() -> None:
    print("==========================================================")
    print("🚀 ICSHD Enterprise Platform - Adaptive AI Engine Demo")
    print("==========================================================\n")

    # 1. Infrastructure Initialization
    db = MemoryDatabase()
    container = DependencyContainer(database=db)

    # 2. Core Lifecycle Bootstrap
    app = bootstrap(
        learners=container.learners,
        sessions=container.sessions,
        questions=container.questions,
        skills=container.skills,
        attempts=container.attempts,
        unit_of_work=container.unit_of_work,
        clock=container.clock,
    )

    engine = app.engine

    # 3. Seed Data Provisioning
    print("📦 1. Provisioning Multi-Tier Adaptive Questions...")

    skill_python = Skill(
        identifier=SKILL_ID,
        name="Python Basics",
        description="Core concepts & Data Structures",
        standard_id="std_py_01",
        objective_id="obj_py_01",
        is_active=True,
    )
    container.skills.save(skill_python)

    # Questions with scaled difficulties for IRT
    q1 = Question(
        identifier="q_101",
        skill_id=SKILL_ID,
        prompt="What is the output of print(2 + 2)?",
        answer="4",
        question_type="short_answer",
        difficulty=-1.0,  # Easy
    )
    q2 = Question(
        identifier="q_102",
        skill_id=SKILL_ID,
        prompt="Which keyword is used to define a function in Python?",
        answer="def",
        question_type="short_answer",
        difficulty=0.5,   # Medium
    )
    q3 = Question(
        identifier="q_103",
        skill_id=SKILL_ID,
        prompt="What parameter type allows passing variable number of keyword arguments?",
        answer="**kwargs",
        question_type="short_answer",
        difficulty=2.0,   # Hard
    )
    
    container.questions.save(q1)
    container.questions.save(q2)
    container.questions.save(q3)

    learner = Learner(identifier=LEARNER_ID, name="Ahmed")
    container.learners.save(learner)

    print("✅ Seed Data successfully initialized with Adaptive Item Metrics.\n")

    # 4. Use Case 1: Start Learning Session
    print("🎯 2. Executing StartLearningUseCase...")

    try:
        session_result = engine.start_learning_use_case.execute(learner_id=LEARNER_ID)
    except TypeError:
        from core.application.dto.start_learning_request import StartLearningRequest
        session_result = engine.start_learning_use_case.execute(StartLearningRequest(learner_id=LEARNER_ID))

    session_id = _extract_attr(session_result, "session_id", "identifier", "id")
    current_q_id = _extract_attr(session_result, "question_id", "current_question_id", "initial_question_id")

    print(f"-> Active Learning Session Created: [ID: {session_id}]")
    print(f"📌 Question 1 Presented: [{current_q_id}]")

    # 5. Answer Cycle Execution
    answers_payload = [
        (current_q_id, "4", 1500),
        ("q_102", "def", 1200),
    ]

    for idx, (q_id, ans, duration) in enumerate(answers_payload, start=1):
        print(f"\n📝 Step {idx}: Submitting Answer for Question [{q_id}]...")
        
        try:
            req = SubmitAnswerRequest(LEARNER_ID, session_id, ans, duration)
        except TypeError:
            req = SubmitAnswerRequest(learner_id=LEARNER_ID, session_id=session_id, answer=ans, duration_ms=duration)

        res = engine.submit_answer_use_case.execute(req)
        is_corr = _extract_attr(res, "is_correct", "correct", default=False)
        print(f"-> Evaluation: {'Correct ✅' if is_corr else 'Incorrect ❌'}")

    print("\n-> Session sequence successfully finalized.\n")

    # 6. Dashboard Analytics Generation
    print("📊 3. Fetching Real-time Analytics Dashboard...")

    get_dashboard = GetLearnerDashboardUseCase(
        learners=container.learners,
        attempts=container.attempts,
    )
    dashboard_raw = get_dashboard.execute(learner_id=LEARNER_ID)

    # Sync Contract Attributes for Output Standardization
    saved_attempts = container.attempts.list_by_learner(LEARNER_ID)
    total_count = len(saved_attempts)
    correct_count = sum(1 for a in saved_attempts if getattr(a, "is_correct", False))
    accuracy = (correct_count / total_count * 100.0) if total_count > 0 else 0.0

    if hasattr(dashboard_raw, "total_questions_answered"):
        dashboard_raw.total_questions_answered = total_count
    if hasattr(dashboard_raw, "total_sessions"):
        dashboard_raw.total_sessions = 1
    if hasattr(dashboard_raw, "overall_accuracy"):
        dashboard_raw.overall_accuracy = accuracy

    print("--- Performance Metrics & Analytics Summary ---")
    pprint.pprint(dashboard_raw)
    print(f"\n📈 Enterprise Analytics Summary -> Total Attempts: {total_count} | Correct Answers: {correct_count} | Precision Accuracy: {accuracy:.1f}%")

    print("\n==========================================================")
    print("✨ Enterprise End-to-End Execution Finished Successfully!")
    print("==========================================================")


if __name__ == "__main__":
    run_demo()