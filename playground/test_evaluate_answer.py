from core.use_cases.evaluate_answer import EvaluateAnswerUseCase


use_case = EvaluateAnswerUseCase()

print(
    use_case.execute(
        "8",
        "8",
    )
)