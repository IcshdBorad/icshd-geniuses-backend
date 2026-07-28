from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from core.services.question_selector import (
    QuestionSelector,
)
from core.services.skill_selector import (
    SkillSelector,
)
from packages.contracts.attempt import Attempt
from packages.contracts.learner import Learner
from packages.contracts.learning_session import (
    LearningSession,
)
from packages.contracts.question import Question
from packages.contracts.skill import Skill


@dataclass(slots=True)
class NextQuestionPipelineResult:
    """
    Result produced by the adaptive next-question pipeline.
    """

    skill: Skill | None
    question: Question | None
    finished: bool = False


class NextQuestionPipeline:
    """
    Adaptive Next Question Pipeline.

    Orchestrates skill and question selection for adaptive learning.
    """

    def __init__(
        self,
        skill_selector: SkillSelector,
        question_selector: QuestionSelector,
    ) -> None:
        self._skill_selector = skill_selector
        self._question_selector = question_selector

    @staticmethod
    def _extract_id(obj: Any) -> str | None:
        if isinstance(obj, dict):
            return obj.get("identifier") or obj.get("id") or obj.get("question_id")
        return getattr(obj, "identifier", None) or getattr(obj, "id", None) or getattr(obj, "question_id", None)

    @staticmethod
    def _extract_diff(obj: Any) -> float:
        if isinstance(obj, dict):
            return float(obj.get("difficulty", 1.0))
        return float(getattr(obj, "difficulty", 1.0))

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def execute(
        self,
        learner: Learner,
        session: LearningSession,
        skills: list[Skill],
        questions: list[Question],
        attempts: list[Attempt],
    ) -> NextQuestionPipelineResult:
        """
        Determine the learner's next adaptive question.
        """
        skill = self._select_skill(
            learner=learner,
            skills=skills,
        )

        # تجميع المعرفات للأسئلة المحلولة والسؤال الحالي
        solved_ids = set()
        if attempts:
            for att in attempts:
                q_id = self._extract_id(att)
                if q_id:
                    solved_ids.add(q_id)

        curr_id = self._extract_id(session)
        if curr_id:
            solved_ids.add(curr_id)

        question: Question | None = None

        # المحاولة عبر المحدد الأساسي للأسئلة
        if skill is not None and questions:
            question = self._select_question(
                learner=learner,
                session=session,
                skill=skill,
                questions=questions,
                attempts=attempts,
            )

        selected_id = self._extract_id(question) if question else None

        # خطة التعويض (Fallback) في حالة عدم إرجاع سؤال أو اختيار سؤال سابق
        if question is None or (selected_id in solved_ids):
            available = [
                q for q in (questions or [])
                if self._extract_id(q) not in solved_ids
            ]

            if available:
                target_diff = float(getattr(learner, "current_difficulty", 1.0))
                question = min(
                    available,
                    key=lambda q: abs(self._extract_diff(q) - target_diff),
                )

        # خطة طوارئ إضافية: إذا لم يُعثر على سؤال غير مجاب، جلب أي سؤال آخَر متاح في البنك غير الحالي
        if question is None and questions:
            for q in questions:
                if self._extract_id(q) != curr_id:
                    question = q
                    break

        finished = (question is None)

        return NextQuestionPipelineResult(
            skill=skill,
            question=question,
            finished=finished,
        )

    # ---------------------------------------------------------
    # Skill Selection
    # ---------------------------------------------------------

    def _select_skill(
        self,
        learner: Learner,
        skills: list[Skill],
    ) -> Skill | None:
        if not skills:
            return None

        try:
            selected = self._skill_selector.select_next_skill(
                learner=learner,
                skills=skills,
            )
            return selected or skills[0]
        except Exception:
            return skills[0]

    # ---------------------------------------------------------
    # Question Selection
    # ---------------------------------------------------------

    def _select_question(
        self,
        learner: Learner,
        session: LearningSession,
        skill: Skill,
        questions: list[Question],
        attempts: list[Attempt],
    ) -> Question | None:
        try:
            return self._question_selector.select_next_question(
                learner=learner,
                session=session,
                skill=skill,
                questions=questions,
                attempts=attempts,
            )
        except Exception:
            return None