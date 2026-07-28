from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    LEARNER = "LEARNER"
    COACH = "COACH"
    PARENT = "PARENT"
    ADMIN = "ADMIN"

class UserProfile(BaseModel):
    genius_code: str = Field(..., description="شفرة العبقري الفريدة الموحدة")
    full_name: str
    role: UserRole
    country: str
    age: Optional[int] = None
    coach_code: Optional[str] = None  # ربط الطالب بالمدرب
    parent_code: Optional[str] = None # ربط الطالب بولي الأمر
    ability_score_theta: float = 0.0   # مؤشر القدرة التكيفي IRT