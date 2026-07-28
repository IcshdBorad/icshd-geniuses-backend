from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ResponseResult(str, Enum):
    CORRECT = "correct"
    INCORRECT = "incorrect"
    SKIPPED = "skipped"


@dataclass(frozen=True)
class ItemMetrics:
    """
    مقاييس السؤال وفق معايير Psychometrics (2PL IRT Model)
    """
    difficulty: float      # معامل الصعوبة (b) - يتراوح عادة بين -3.0 و +3.0
    discrimination: float  # معامل التمييز (a) - عادة بين 0.5 و 2.5
    guessing: float = 0.0  # معامل التخمين (c) - خياري للأسئلة متعددة الخيارات


@dataclass
class StudentAbilityProfile:
    """
    ملف قدرة الطالب التكيفي
    """
    student_id: str
    subject_id: str
    theta: float = 0.0                      # مستوى القدرة الحالي (الافتراضي 0.0)
    standard_error: float = 1.0             # نسبة الخطأ المعياري في التقدير (SE)
    total_questions_answered: int = 0
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def is_estimation_stable(self, threshold: float = 0.3) -> bool:
        """هل تقدير مستوى الطالب أصبح مستقراً بدقة عالية؟"""
        return self.standard_error <= threshold