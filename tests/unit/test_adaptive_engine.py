from __future__ import annotations

import pytest
from core.services.adaptive_engine import AdaptiveEngine, PerformanceMetrics
from core.domain.entities.adaptive_profile import AdaptiveProfile


@pytest.fixture
def base_profile():
    return AdaptiveProfile(
        learner_id="learner_123",
        path_id="hyper_mental_flow",
        current_difficulty=2.0,
        accuracy_rate=0.80,
        avg_response_time_ms=3000.0
    )


@pytest.fixture
def adaptive_engine():
    """تغيير الاسم من engine إلى adaptive_engine لمنع التعارض مع DB engine في conftest."""
    return AdaptiveEngine(target_accuracy=0.80)


def test_difficulty_increases_on_correct_fast_answer(adaptive_engine, base_profile):
    """التحقق من زيادة مستوى الصعوبة عند إجابة صحيحة وسريعة جداً."""
    initial_diff = base_profile.current_difficulty
    metrics = PerformanceMetrics(is_correct=True, response_time_ms=1000.0, expected_time_ms=3000.0)

    updated_profile = adaptive_engine.update_profile(base_profile, metrics)

    assert updated_profile.current_difficulty > initial_diff
    assert updated_profile.consecutive_correct == 1


def test_difficulty_boost_after_three_consecutive_correct(adaptive_engine, base_profile):
    """التحقق من مضاعفة خطوة الصعوبة بعد 3 إجابات صحيحة متتالية (مكافأة التفوق)."""
    base_profile.consecutive_correct = 2  # المحاولة القادمة هي الثالثة

    metrics = PerformanceMetrics(is_correct=True, response_time_ms=3000.0, expected_time_ms=3000.0)

    diff_before = base_profile.current_difficulty
    updated_profile = adaptive_engine.update_profile(base_profile, metrics)
    diff_increase = updated_profile.current_difficulty - diff_before

    # الخطوة العادية = 0.1 * speed_factor(1.0) = 0.1, مع المكافأة (1.5x) تصبح 0.15
    assert round(diff_increase, 2) == 0.15


def test_difficulty_lower_bound_limit(adaptive_engine, base_profile):
    """التحقق من عدم نزول مستوى الصعوبة عن الحد الأدنى (1.0)."""
    base_profile.current_difficulty = 1.05
    metrics = PerformanceMetrics(is_correct=False, response_time_ms=5000.0, expected_time_ms=3000.0)

    updated_profile = adaptive_engine.update_profile(base_profile, metrics)

    assert updated_profile.current_difficulty == 1.0