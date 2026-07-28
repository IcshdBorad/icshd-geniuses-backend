import pytest
from core.services.irt_engine import update_ability, ABILITY_MIN, ABILITY_MAX


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
        assert hard >= easy, "السؤال الصعب يرفع القدرة أكثر"

    def test_difficulty_effect_on_incorrect(self):
        initial = 0.0
        disc = 1.0
        easy = update_ability(initial, -1.0, disc, False)
        hard = update_ability(initial, 1.0, disc, False)
        assert easy <= hard, "السؤال السهل يخفض القدرة أكثر"

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
        initial = -3.8
        new = update_ability(initial, 0.0, 1.0, False)
        assert new >= ABILITY_MIN

    def test_ability_bounds_upper(self):
        initial = 3.8
        new = update_ability(initial, 0.0, 1.0, True)
        assert new <= ABILITY_MAX

    def test_stable_for_extreme_values(self):
        initial = 0.0
        for diff in [-3.0, 3.0]:
            for disc in [0.3, 2.5]:
                for correct in [True, False]:
                    new = update_ability(initial, diff, disc, correct)
                    assert ABILITY_MIN <= new <= ABILITY_MAX