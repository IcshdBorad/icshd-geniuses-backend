from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.infrastructure.models import Base

DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


def get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()