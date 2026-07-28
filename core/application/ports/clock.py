from __future__ import annotations

from datetime import datetime
from typing import Protocol


class Clock(Protocol):
    """
    Provides the current application time.
    """

    def now(self) -> datetime:
        ...