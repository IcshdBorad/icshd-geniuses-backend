from sqlalchemy import Column, String, Float, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class CognitivePath(Base):
    __tablename__ = "cognitive_paths"

    id = Column(String, primary_key=True)  # e.g., 'hyper_mental_flow'
    name = Column(String, nullable=False)   # e.g., 'محرك التدفق الذهني'
    description = Column(String)
    config = Column(JSON, default={})       # خيارات وإعدادات المسار الخاصة

class AdaptiveProfile(Base):
    __tablename__ = "adaptive_profiles"

    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, unique=True)
    path_id = Column(String, ForeignKey("cognitive_paths.id"), nullable=False)
    
    # مؤشرات الذكاء والتكيف (Dynamic Metrics)
    current_difficulty_level = Column(Float, default=1.0)  # مقياس مستمر 1.0 -> 10.0
    avg_response_time_ms = Column(Float, default=0.0)      # متوسط سرعة الإجابة
    accuracy_rate = Column(Float, default=0.0)             # نسبة الإجابات الصحيحة (0.0 -> 1.0)
    consecutive_correct = Column(Integer, default=0)       # الإجابات الصحيحة المتتالية
    consecutive_incorrect = Column(Integer, default=0)     # الأخطاء المتتالية
    
    last_updated = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="adaptive_profile")
    path = relationship("CognitivePath")