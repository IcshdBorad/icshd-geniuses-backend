from dataclasses import dataclass


@dataclass
class Learner:
    """
    Represents a learner in the platform.
    """

    identifier: str
    name: str
    email: str = ""
    is_active: bool = True