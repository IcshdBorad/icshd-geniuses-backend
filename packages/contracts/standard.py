from dataclasses import dataclass


@dataclass(frozen=True)
class Standard:
    """
    Represents an educational standard.
    """

    identifier: str
    name: str
    description: str

    framework_id: str