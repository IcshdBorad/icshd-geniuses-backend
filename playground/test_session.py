from core.domains.session.session_engine import SessionEngine

engine = SessionEngine()

session = engine.start("L001")

print(session)