from domain.knowledge.skill import Skill


def test_create_skill():
    skill = Skill(
        identifier="SKILL-ADD-001",
        name="Add two one-digit numbers mentally",
        description="Basic addition"
    )

    assert skill.identifier == "SKILL-ADD-001"
    assert skill.name == "Add two one-digit numbers mentally"