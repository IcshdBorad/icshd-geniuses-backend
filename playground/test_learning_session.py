from packages.contracts.learning_session import LearningSession

session = LearningSession(
    identifier="SESSION-001",
    learner_id="L001",
    completed=False,
)

print(session)