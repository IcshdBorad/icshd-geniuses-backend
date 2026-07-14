from core.domains.adaptive.adaptive_engine import AdaptiveEngine

from packages.contracts.skill import Skill
from packages.contracts.skill_status import SkillStatus


status = SkillStatus(
    learner_id="L001",
    skill_id="SKILL-ADD-001",
    attempts=10,
    accuracy=0.95,
    average_time_ms=2500,
    mastered=True,
)

current = Skill(
    identifier="SKILL-ADD-001",
    name="Addition",
    description="",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

next_skill = Skill(
    identifier="SKILL-ADD-002",
    name="Addition Level 2",
    description="",
    standard_id="STD-MA",
    objective_id="OBJ-ADD-001",
)

difficulty, skill = AdaptiveEngine().decide(
    status,
    current,
    next_skill,
)

print(difficulty)
print(skill)