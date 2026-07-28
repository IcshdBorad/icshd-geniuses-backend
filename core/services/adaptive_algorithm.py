import math
from typing import List, Tuple

class AdaptiveEngineService:
    """
    خدمة المحرك التكيفي لحساب مستوى قدرة الطالب (Ability/Theta)
    واختيار الأسئلة بناءً على نموذج 1PL IRT (Rasch Model).
    """

    @staticmethod
    def calculate_probability(theta: float, difficulty: float) -> float:
        """
        حساب احتمال إجابة الطالب الصحيحة على سؤال ذي صعوبة محددة.
        P(theta) = 1 / (1 + e^(-(theta - difficulty)))
        """
        return 1.0 / (1.0 + math.exp(-(theta - difficulty)))

    @classmethod
    def update_theta(cls, current_theta: float, responses: List[Tuple[float, bool]], learning_rate: float = 0.4) -> float:
        """
        تحديث قدرة الطالب (Theta) بناءً على الإجابات الأخيرة.
        responses: قائمة تحتوي على (صعوبة السؤال، هل الإجابة صحيحة)
        """
        if not responses:
            return current_theta

        theta = current_theta
        for difficulty, is_correct in responses:
            p = cls.calculate_probability(theta, difficulty)
            actual = 1.0 if is_correct else 0.0
            # تحديث القدرة بواسطة الشدة التفاضلية (Stochastic Gradient Step)
            theta += learning_rate * (actual - p)

        # حصر مستوى القدرة ضمن مجال منطقي مثلاً [-3.0, 3.0]
        return max(-3.0, min(3.0, theta))