from packages.contracts.skill import Skill
from packages.contracts.question import Question
from packages.contracts.learning_session import LearningSession
from packages.contracts.attempt import Attempt
from packages.contracts.skill_status import SkillStatus


class MemoryDatabase:
    """
    Simple in-memory database.
    """

    def __init__(self):
        self.skills: dict[str, Skill] = {}

        self.questions: dict[str, Question] = {}

        self.sessions: dict[str, LearningSession] = {}

        self.attempts: dict[str, Attempt] = {}

        self.skill_statuses: dict[str, SkillStatus] = {}

        self.learners: dict[str, dict] = {}