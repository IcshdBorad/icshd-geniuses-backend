from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Performance:
    """
    Snapshot of learner performance statistics.
    Produced by PerformanceAnalyzer.
    """

    total_attempts: int = 0

    correct_attempts: int = 0

    incorrect_attempts: int = 0

    accuracy: float = 0.0

    average_score: float = 0.0

    average_duration_ms: float = 0.0

    current_streak: int = 0

    best_streak: int = 0

    last_correct: bool = False