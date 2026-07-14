from dataclasses import dataclass


@dataclass(frozen=True)
class Standard:
    """
    Represents a knowledge standard.
    """

    identifier: str
    framework_id: str

    name: str
    description: str

    is_active: bool = True

    external_id: str | None = None