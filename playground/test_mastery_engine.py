from datetime import datetime

from packages.contracts.attempt import Attempt
from core.domains.knowledge.mastery_engine import MasteryEngine


attempts = [
    Attempt(
        identifier="A1",
        learner_id="L001",
        question_id="SKILL-ADD-001-Q1",
        submitted_answer="8",
        is_correct=True,
        duration_ms=4200,
        attempted_at=datetime.now(),
    ),
    Attempt(
        identifier="A2",
        learner_id="L001",
        question_id="SKILL-ADD-001-Q2",
        submitted_answer="5",
        is_correct=True,
        duration_ms=5100,
        attempted_at=datetime.now(),
    ),
    Attempt(
        identifier="A3",
        learner_id="L001",
        question_id="SKILL-ADD-001-Q3",
        submitted_answer="9",
        is_correct=False,
        duration_ms=4800,
        attempted_at=datetime.now(),
    ),
]

engine = MasteryEngine()

status = engine.evaluate(
    learner_id="L001",
    skill_id="SKILL-ADD-001",
    attempts=attempts,
)

print(status)