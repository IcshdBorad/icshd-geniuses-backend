from abc import ABC, abstractmethod
from typing import Optional
from core.infrastructure.models import SessionModel, LearnerModel

class SessionRepositoryInterface(ABC):
    @abstractmethod
    async def create(self, learner_id: str) -> SessionModel:
        pass

class LearnerRepositoryInterface(ABC):
    @abstractmethod
    async def get_by_id(self, learner_id: str) -> Optional[LearnerModel]:
        pass