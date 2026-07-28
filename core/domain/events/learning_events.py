from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, List


@dataclass(frozen=True)
class AnswerSubmittedEvent:
    learner_id: str
    session_id: str
    question_id: str
    is_correct: bool
    score: float
    duration_ms: int
    timestamp: datetime = datetime.utcnow()


class EventDispatcher:
    """Central Domain Event Dispatcher for Decoupled Architecture."""

    def __init__(self) -> None:
        self._handlers: Dict[type, List[Callable[[Any], None]]] = {}

    def register(self, event_type: type, handler: Callable[[Any], None]) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def dispatch(self, event: Any) -> None:
        event_type = type(event)
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                handler(event)