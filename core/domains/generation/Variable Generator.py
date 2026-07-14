import random


class VariableGenerator:
    """
    Generates random values for question templates.
    """

    def integer(
        self,
        minimum: int,
        maximum: int,
    ) -> int:
        return random.randint(minimum, maximum)

    def integer_pair(
        self,
        minimum: int,
        maximum: int,
    ) -> tuple[int, int]:
        return (
            self.integer(minimum, maximum),
            self.integer(minimum, maximum),
        )