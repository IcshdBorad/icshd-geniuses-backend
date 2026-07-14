class Scorer:
    """
    Calculates score.
    """

    def score(self, is_correct: bool) -> int:
        return 100 if is_correct else 0