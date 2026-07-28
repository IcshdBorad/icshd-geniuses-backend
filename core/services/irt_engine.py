from __future__ import annotations

import math
from typing import List, Any

# الحدود القياسية لنطاق قدرة الطالب (Theta)
ABILITY_MIN = -4.0
ABILITY_MAX = 4.0


def calculate_probability(theta: float, difficulty: float, discrimination: float = 1.0) -> float:
    """
    2PL IRT Model: P(theta) = 1 / (1 + e^-(a * (theta - b)))
    where 'a' is discrimination and 'b' is difficulty.
    """
    return 1.0 / (1.0 + math.exp(-discrimination * (theta - difficulty)))


def update_ability(
    current_theta: float,
    question_difficulty: float,
    discrimination: float = 1.0,
    is_correct: bool = True,
    learning_rate: float = 0.3,
) -> float:
    """
    Updates learner ability (Theta) using Stochastic Gradient step for 2PL IRT.
    """
    prob = calculate_probability(current_theta, question_difficulty, discrimination)
    actual = 1.0 if is_correct else 0.0

    # Gradient step weighted by item discrimination (a)
    new_theta = current_theta + learning_rate * discrimination * (actual - prob)

    # Clamping theta to standardized bounds
    return max(ABILITY_MIN, min(ABILITY_MAX, new_theta))


class AdaptiveIRTEngine:
    """
    Domain Service for managing adaptive learning sessions.
    """

    def update_ability(
        self,
        current_theta: float,
        question_difficulty: float,
        discrimination: float = 1.0,
        is_correct: bool = True,
        learning_rate: float = 0.3,
    ) -> float:
        return update_ability(
            current_theta, question_difficulty, discrimination, is_correct, learning_rate
        )

    def select_optimal_next_question(
        self,
        learner_theta: float,
        candidate_questions: List[Any],
    ) -> Any | None:
        """
        Selects the question whose difficulty is closest to learner's current theta
        to maximize Information Value (Fisher Information in 1PL/2PL).
        """
        if not candidate_questions:
            return None

        return min(
            candidate_questions,
            key=lambda q: abs(getattr(q, "difficulty", 0.0) - learner_theta),
        )