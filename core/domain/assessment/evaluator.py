class Evaluator:
    """
    Compares learner answer with correct answer.
    """

    def evaluate(self, learner_answer: str, correct_answer: str) -> bool:
        return learner_answer == correct_answer