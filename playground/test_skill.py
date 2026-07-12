from packages.contracts.skill import Skill

skill = Skill(
    identifier="SKILL-ADD-001",
    name="Add two one-digit numbers mentally",
    description="Basic mental addition",
    standard_id="STD-MATH-001",
    objective_id="OBJ-ADD-001",
)

print(skill)