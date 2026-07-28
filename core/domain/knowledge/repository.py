from packages.contracts.framework import Framework
from packages.contracts.standard import Standard
from packages.contracts.learning_objective import LearningObjective
from packages.contracts.skill import Skill


class KnowledgeRepository:
    """
    In-memory repository for canonical knowledge entities.
    """

    def __init__(self):
        self._frameworks: dict[str, Framework] = {}
        self._standards: dict[str, Standard] = {}
        self._objectives: dict[str, LearningObjective] = {}
        self._skills: dict[str, Skill] = {}

    # ---------- Framework ----------

    def add_framework(self, framework: Framework):
        self._frameworks[framework.identifier] = framework

    def get_framework(self, identifier: str):
        return self._frameworks.get(identifier)

    def list_frameworks(self):
        return list(self._frameworks.values())

    # ---------- Standard ----------

    def add_standard(self, standard: Standard):
        self._standards[standard.identifier] = standard

    def get_standard(self, identifier: str):
        return self._standards.get(identifier)

    def list_standards(self):
        return list(self._standards.values())

    # ---------- Learning Objective ----------

    def add_learning_objective(self, objective: LearningObjective):
        self._objectives[objective.identifier] = objective

    def get_learning_objective(self, identifier: str):
        return self._objectives.get(identifier)

    def list_learning_objectives(self):
        return list(self._objectives.values())

    # ---------- Skill ----------

    def add_skill(self, skill: Skill):
        self._skills[skill.identifier] = skill

    def get_skill(self, identifier: str):
        return self._skills.get(identifier)

    def list_skills(self):
        return list(self._skills.values())