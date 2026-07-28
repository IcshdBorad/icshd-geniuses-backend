from abc import ABC, abstractmethod
from typing import Optional
from core.domain.entities.adaptive_profile import AdaptiveProfile


class IAdaptiveProfileRepository(ABC):
    """
    Domain Repository Interface for Adaptive Profile.
    Defines the contract without coupling to specific databases or caching layers.
    """

    @abstractmethod
    def get_by_learner_id(self, learner_id: str) -> Optional[AdaptiveProfile]:
        """Fetch adaptive profile by learner ID."""
        pass

    @abstractmethod
    def save(self, profile: AdaptiveProfile) -> None:
        """Save or update adaptive profile."""
        pass