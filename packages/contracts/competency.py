from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Competency:
    """
    Snapshot of learner competency.

    Produced by CompetencyEngine.
    """

    knowledge: float = 0.0

    speed: float = 0.0

    stability: float = 0.0

    retention: float = 0.0

    confidence: float = 0.0

    overall_competency: float = 0.0