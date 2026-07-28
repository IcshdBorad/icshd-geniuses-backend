from __future__ import annotations

from datetime import datetime, timezone

from core.application.ports.clock import Clock


class SystemClock(Clock):
    """
    Production implementation of Clock using system UTC time.
    """

    def now(self) -> datetime:
        return datetime.now(timezone.utc)