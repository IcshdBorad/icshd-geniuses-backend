from core.domains.assessment.evaluator import Evaluator
from core.domains.assessment.scorer import Scorer
from core.domains.assessment.feedback import FeedbackGenerator

result = Evaluator().evaluate("8", "8")

print(result)
print(Scorer().score(result))
print(FeedbackGenerator().feedback(result))