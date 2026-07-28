# infrastructure/db/models.py

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from infrastructure.db.base import Base

class AdaptiveProfileModel(Base):
    __tablename__ = "adaptive_profiles"

    id = Column(String, primary_key=True)
    learner_id = Column(String, ForeignKey("learners.id", ondelete="CASCADE"), nullable=False, unique=True)
    path_id = Column(String, nullable=False, default="hyper_mental_flow")
    
    current_difficulty = Column(Float, nullable=False, default=1.0)
    accuracy_rate = Column(Float, nullable=False, default=0.0)
    avg_response_time_ms = Column(Float, nullable=False, default=0.0)
    consecutive_correct = Column(Integer, nullable=False, default=0)
    consecutive_incorrect = Column(Integer, nullable=False, default=0)
    
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow)

    # علاقة عكسية مع جدول المتعلمين
    learner = relationship("LearnerModel", back_populates="adaptive_profile")