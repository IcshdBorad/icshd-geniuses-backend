class FeedbackGenerator:
    """
    Generates learner feedback.
    """

    def feedback(self, is_correct: bool) -> str:
        if is_correct:
            return "Correct!"
        return "Try Again!"