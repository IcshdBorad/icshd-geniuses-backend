from core.domains.generation.rule_engine import RuleEngine

engine = RuleEngine()

print(engine.validate({"a": 4, "b": 5}))