from core.domains.assessment.evaluator import Evaluator
from core.domains.assessment.scorer import Scorer
from core.domains.assessment.feedback import FeedbackGenerator


class EvaluateAnswerUseCase:
    """
    Evaluates a learner answer.
    """

    def __init__(self):
        self.evaluator = Evaluator()
        self.scorer = Scorer()
        self.feedback = FeedbackGenerator()

    def execute(
        self,
        learner_answer: str,
        correct_answer: str,
    ):
        correct = self.evaluator.evaluate(
            learner_answer,
            correct_answer,
        )

        score = self.scorer.score(correct)

        feedback = self.feedback.feedback(correct)

        return correct, score, feedback