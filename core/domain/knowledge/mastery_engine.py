from packages.contracts.attempt import Attempt
from packages.contracts.skill_status import SkillStatus


class MasteryEngine:
    """
    Calculates learner mastery from attempts.
    """

    def evaluate(self, learner_id: str, skill_id: str, attempts: list[Attempt]) -> SkillStatus:

        skill_attempts = [
            attempt
            for attempt in attempts
            if attempt.learner_id == learner_id
            and attempt.question_id.startswith(skill_id)
        ]

        total = len(skill_attempts)

        if total == 0:
            return SkillStatus(
                learner_id=learner_id,
                skill_id=skill_id,
                attempts=0,
                accuracy=0.0,
                average_time_ms=0.0,
                mastered=False,
            )

        correct = sum(a.is_correct for a in skill_attempts)

        accuracy = correct / total

        average_time = (
            sum(a.duration_ms for a in skill_attempts)
            / total
        )

        mastered = (
            accuracy >= 0.85
            and average_time <= 6000
        )

        return SkillStatus(
            learner_id=learner_id,
            skill_id=skill_id,
            attempts=total,
            accuracy=accuracy,
            average_time_ms=average_time,
            mastered=mastered,
        )