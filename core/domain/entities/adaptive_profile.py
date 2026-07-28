# core/domain/entities/adaptive_profile.py

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List

@dataclass(slots=True)
class CognitivePath:
    id: str
    name: str
    description: str = ""
    skill_ids: List[str] = field(default_factory=list)  # ربط المسار بالمهارات المحددة
    config: dict = field(default_factory=dict)

@dataclass(slots=True)
class AdaptiveProfile:
    learner_id: str
    path_id: str
    current_difficulty: float = 1.0
    accuracy_rate: float = 0.0
    avg_response_time_ms: float = 0.0
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    id: Optional[str] = None

    def get_dynamic_expected_time(self) -> float:
        """
        حساب الوقت المتوقع الديناميكي بناءً على معدل سرعة الطفل السابقة، 
        مع وضع حد أدنى وأقصى منطقي (2000ms - 8000ms).
        """
        if self.avg_response_time_ms <= 0:
            return 3000.0  # القيمة الافتراضية للبداية
        return max(2000.0, min(8000.0, self.avg_response_time_ms))