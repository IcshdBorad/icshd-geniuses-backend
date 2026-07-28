from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class LearnerModel(Base):
    __tablename__ = "learners"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)


class AdaptiveProfileModel(Base):
    __tablename__ = "adaptive_profiles"

    id = Column(String, primary_key=True, index=True)
    learner_id = Column(String, ForeignKey("learners.id"), nullable=False)


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    learner_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))