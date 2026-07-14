from dataclasses import dataclass


@dataclass(frozen=True)
class Framework:
    """
    Represents an educational framework.
    """

    identifier: str
    name: str
    description: str

    is_active: bool = True

    external_id: str | None = None