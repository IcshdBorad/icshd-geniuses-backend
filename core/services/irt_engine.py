from __future__ import annotations

import math
from typing import List


class AdaptiveIRTEngine:
    """
    1-Parameter Logistic (1PL) Rasch Model for Item Response Theory (IRT).
    Estimates learner ability (Theta) dynamically after every response.
    """

    @staticmethod
    def calculate_probability(theta: float, difficulty: float) -> float:
        """Calculates the probability of a correct response: P(Theta) = 1 / (1 + e^-(theta - difficulty))."""
        return 1.0 / (1.0 + math.exp(-(theta - difficulty)))

    def update_ability(
        self,
        current_theta: float,
        question_difficulty: float,
        is_correct: bool,
        learning_rate: float = 0.3,
    ) -> float:
        """
        Updates the learner's estimated ability (Theta) based on performance.
        Theta typically ranges from -3.0 (beginner) to +3.0 (expert).
        """
        prob = self.calculate_probability(current_theta, question_difficulty)
        actual = 1.0 if is_correct else 0.0
        
        # Stochastic Gradient Ascent update step
        new_theta = current_theta + learning_rate * (actual - prob)
        
        # Clamping theta to realistic bounds [-3.0, 3.0]
        return max(-3.0, min(3.0, new_theta))

    def select_optimal_next_question(
        self,
        learner_theta: float,
        candidate_questions: List[Any],
    ) -> Any:
        """Selects the question whose difficulty is closest to the learner's current ability."""
        if not candidate_questions:
            return None

        # Absolute difference between theta and question difficulty
        return min(
            candidate_questions,
            key=lambda q: abs(getattr(q, "difficulty", 1.0) - learner_theta),
        )