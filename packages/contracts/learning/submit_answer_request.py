from dataclasses import dataclass


@dataclass(frozen=True)
class SubmitAnswerRequest:
    """
    Request submitted by a learner when answering a question.
    """

    learner_id: str

    session_id: str

    question_id: str

    submitted_answer: str

    duration_ms: int