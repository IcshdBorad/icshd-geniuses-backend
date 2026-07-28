import pytest
from core.services.irt_engine import (
    update_ability,
    AdaptiveIRTEngine,
    ABILITY_MIN,
    ABILITY_MAX,
)


class TestIRTEngine:

    def test_ability_increases_on_correct(self):
        initial = 0.0
        difficulty = 0.0
        discrimination = 1.0
        new = update_ability(initial, difficulty, discrimination, True)
        assert new > initial
        assert ABILITY_MIN <= new <= ABILITY_MAX

    def test_ability_decreases_on_incorrect(self):
        initial = 0.0
        difficulty = 0.0
        discrimination = 1.0
        new = update_ability(initial, difficulty, discrimination, False)
        assert new < initial
        assert ABILITY_MIN <= new <= ABILITY_MAX

    def test_difficulty_effect_on_correct(self):
        initial = 0.0
        disc = 1.0
        easy = update_ability(initial, -1.0, disc, True)
        hard = update_ability(initial, 1.0, disc, True)
        assert hard >= easy, "السؤال الصعب يرفع القدرة أكثر عند الإجابة الصحيحة"

    def test_difficulty_effect_on_incorrect(self):
        initial = 0.0
        disc = 1.0
        easy = update_ability(initial, -1.0, disc, False)
        hard = update_ability(initial, 1.0, disc, False)
        assert easy <= hard, "السؤال السهل يخفض القدرة أكثر عند الإجابة الخاطئة"

    def test_discrimination_effect(self):
        initial = 0.0
        difficulty = 0.0
        low = 0.5
        high = 2.0

        low_correct = update_ability(initial, difficulty, low, True)
        high_correct = update_ability(initial, difficulty, high, True)
        assert high_correct >= low_correct, "تمييز أعلى يرفع أكثر"

        low_incorrect = update_ability(initial, difficulty, low, False)
        high_incorrect = update_ability(initial, difficulty, high, False)
        assert high_incorrect <= low_incorrect, "تمييز أعلى يخفض أكثر"

    def test_ability_bounds_lower(self):
        initial = -3.9
        new = update_ability(initial, 0.0, 1.0, False)
        assert new >= ABILITY_MIN

    def test_ability_bounds_upper(self):
        initial = 3.9
        new = update_ability(initial, 0.0, 1.0, True)
        assert new <= ABILITY_MAX

    def test_select_optimal_next_question(self):
        class DummyQuestion:
            def __init__(self, q_id: int, diff: float):
                self.id = q_id
                self.difficulty = diff

        engine = AdaptiveIRTEngine()
        questions = [
            DummyQuestion(1, -2.0),
            DummyQuestion(2, 0.1),
            DummyQuestion(3, 1.5),
        ]
        
        # عند قدرة 0.0، يجب اختار السؤال رقم 2 (صعوبة 0.1 هي الأقرب)
        selected = engine.select_optimal_next_question(0.0, questions)
        assert selected is not None
        assert selected.id == 2