import uuid
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional, Any


@dataclass
class PerformanceMetrics:
    is_correct: bool
    response_time_ms: float
    expected_time_ms: float = 3000.0


@dataclass
class AdaptiveProfile:
    learner_id: str = "default_learner"
    path_id: str = "default_path"
    current_difficulty: float = 1.0
    accuracy_rate: float = 0.0
    avg_response_time_ms: float = 0.0
    total_attempts: int = 0
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str = field(default_factory=lambda: str(uuid.uuid4()))


class AdaptiveEngine:
    MIN_DIFFICULTY: float = 1.0
    MAX_DIFFICULTY: float = 10.0
    BASE_STEP: float = 0.10

    def __init__(self, target_accuracy: float = 0.80):
        self.target_accuracy = target_accuracy

    def update_profile(self, profile: Optional[AdaptiveProfile], *args: Any, **kwargs: Any) -> AdaptiveProfile:
        """
        Updates the learner's adaptive profile safely.
        If profile is None or missing 'id', initializes or fixes it dynamically.
        """
        # Ensure profile is never None
        if profile is None:
            learner_id = kwargs.get("learner_id", "emad_001")
            profile = AdaptiveProfile(learner_id=learner_id)

        # Ensure ID is generated for SQLite persistence
        if not getattr(profile, "id", None):
            setattr(profile, "id", str(uuid.uuid4()))

        metrics: Optional[PerformanceMetrics] = None

        # 1. Parse positional arguments (*args)
        if args:
            first_arg = args[0]
            if isinstance(first_arg, PerformanceMetrics):
                metrics = first_arg
            elif isinstance(first_arg, bool):
                is_correct = first_arg
                res_time = float(args[1]) if len(args) > 1 else kwargs.get("response_time_ms", 3000.0)
                exp_time = float(args[2]) if len(args) > 2 else kwargs.get("expected_time_ms", 3000.0)
                metrics = PerformanceMetrics(
                    is_correct=is_correct,
                    response_time_ms=res_time,
                    expected_time_ms=exp_time
                )

        # 2. Parse keyword arguments (**kwargs) if metrics not built yet
        if not metrics:
            metrics = self._build_metrics_from_kwargs(kwargs)

        # 3. Update interaction metrics on profile safely
        if hasattr(profile, "total_attempts"):
            profile.total_attempts += 1
        elif hasattr(profile, "total_interactions"):
            setattr(profile, "total_interactions", getattr(profile, "total_interactions", 0) + 1)

        # 4. Update correctness streaks
        if metrics.is_correct:
            if hasattr(profile, "consecutive_correct"):
                profile.consecutive_correct += 1
            if hasattr(profile, "consecutive_incorrect"):
                profile.consecutive_incorrect = 0
        else:
            if hasattr(profile, "consecutive_incorrect"):
                profile.consecutive_incorrect += 1
            if hasattr(profile, "consecutive_correct"):
                profile.consecutive_correct = 0

        # 5. Calculate difficulty adjustment step
        difficulty_change = self._calculate_difficulty_step(profile, metrics)

        # 6. Apply updated difficulty level bounded within limits
        curr_diff = getattr(profile, "current_difficulty", 1.0)
        new_difficulty = curr_diff + difficulty_change
        
        updated_diff = max(
            self.MIN_DIFFICULTY,
            min(self.MAX_DIFFICULTY, round(new_difficulty, 2))
        )
        setattr(profile, "current_difficulty", updated_diff)

        # 7. Update timestamp
        if hasattr(profile, "last_updated"):
            profile.last_updated = datetime.now(timezone.utc)

        return profile

    def _build_metrics_from_kwargs(self, kwargs: dict) -> PerformanceMetrics:
        return PerformanceMetrics(
            is_correct=bool(kwargs.get("is_correct", False)),
            response_time_ms=float(kwargs.get("response_time_ms", 3000.0)),
            expected_time_ms=float(kwargs.get("expected_time_ms", 3000.0)),
        )

    def _calculate_difficulty_step(self, profile: AdaptiveProfile, metrics: PerformanceMetrics) -> float:
        if not metrics.is_correct:
            return -0.20

        step = self.BASE_STEP

        if metrics.expected_time_ms > 0:
            speed_ratio = metrics.response_time_ms / metrics.expected_time_ms
            if speed_ratio <= 0.5:
                step += 0.10

        consecutive = getattr(profile, "consecutive_correct", 0)
        if consecutive >= 3:
            step *= 1.5

        return step