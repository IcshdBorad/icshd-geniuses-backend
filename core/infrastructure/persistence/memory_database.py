from __future__ import annotations

from typing import Any, Dict


class MemoryDatabase:
    """Shared in-memory storage simulating database tables."""

    def __init__(self) -> None:
        self.learners: Dict[str, Any] = {}
        self.sessions: Dict[str, Any] = {}
        self.skills: Dict[str, Any] = {}
        self.questions: Dict[str, Any] = {}
        self.attempts: Dict[str, Any] = {}

    def clear(self) -> None:
        """Clear all stored data."""
        self.learners.clear()
        self.sessions.clear()
        self.skills.clear()
        self.questions.clear()
        self.attempts.clear()