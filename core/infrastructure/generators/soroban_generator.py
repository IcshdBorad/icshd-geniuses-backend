import random
from typing import List, Dict, Any

class SorobanGenerator:
    """مولّد مسائل السوروبان الديناميكي اللانهائي."""

    @staticmethod
    def is_valid_step(current_val: int, num_to_add: int, level: str, digit_limit: int) -> bool:
        """
        التحقق من صحة الحركة على العداد بناءً على المستوى:
        - عدم تجاوز حدود الخانات (مثلاً: آحاد 0-9).
        - عدم الوصول لقيم سالبة نهائياً.
        - احترام منطق القواعد (S = مباشر فقط، F5 = مكملات 5، F10 = مكملات 10).
        """
        next_val = current_val + num_to_add
        
        # 1. منع النتائج والخطوات السالبة إطلاقاً
        if next_val < 0:
            return False
        
        # 2. التأكد من الحد الأقصى لكل خانة
        max_val_per_digit = (10 ** digit_limit) - 1
        if next_val > max_val_per_digit:
            return False

        # 3. التحقق على مستوى خرزات كل خانة (Digit level verification)
        curr_d = current_val % 10
        num_d = num_to_add % 10
        next_d = curr_d + num_d

        if level == "S":
            # مباشر: الخرزة الخماسية (Upper) والخرزات الأحادية (Lower) لا تتداخلان مع قواعد مكملة
            curr_lower = curr_d % 5
            num_lower = num_d if num_d > 0 else abs(num_d)
            if num_d > 0:
                if curr_d < 5 and next_d >= 5 and num_d != 5: return False
                if curr_lower + num_lower > 4: return False
            else:
                if curr_d >= 5 and next_d < 5 and abs(num_d) != 5: return False
                if curr_lower - num_lower < 0: return False

        elif level == "F5":
            # يسمح بقواعد مكملات الـ 5 بدون التكفير أو الترحيل للعشرات
            if current_val // 10 != next_val // 10:
                return False # يُمنع الترحيل لخانة العشرات

        elif level == "F10":
            # يسمح بمكملات الـ 10 (الترحيل)
            pass

        return True

    @classmethod
    def generate_problem(cls, level: str, digits_count: int, rows_count: int) -> Dict[str, Any]:
        """توليد مسألة ديناميكية كاملة بدون نواتج سالبة وبعدد صفوف غير محدود."""
        min_val = 1 if digits_count == 1 else 10 ** (digits_count - 1)
        max_val = (10 ** digits_count) - 1

        while True:
            numbers = []
            # الرقم الأول يكون موجباً دائماً
            first_num = random.randint(min_val, max_val)
            numbers.append(first_num)
            current_sum = first_num

            success = True
            for _ in range(rows_count - 1):
                valid_moves = []
                # اختيار نطاق أرقام بناءً على الخانات
                search_range = list(range(-max_val, max_val + 1))
                random.shuffle(search_range)

                for delta in search_range:
                    if delta == 0:
                        continue
                    if cls.is_valid_step(current_sum, delta, level, digits_count):
                        valid_moves.append(delta)
                        if len(valid_moves) > 5: # مكتفي بحركات آمنة
                            break

                if not valid_moves:
                    success = False
                    break

                chosen_delta = random.choice(valid_moves)
                numbers.append(chosen_delta)
                current_sum += chosen_delta

            if success and current_sum > 0:
                return {
                    "level": level,
                    "digits_count": digits_count,
                    "rows_count": rows_count,
                    "numbers": numbers,
                    "final_result": current_sum
                }