import json
from typing import Optional
from redis import Redis
from sqlalchemy.orm import Session

from core.domain.entities.adaptive_profile import AdaptiveProfile
from core.domain.repositories.adaptive_profile_repository import IAdaptiveProfileRepository
from core.infrastructure.models import AdaptiveProfileModel


class AdaptiveProfileRepository(IAdaptiveProfileRepository):
    def __init__(self, db_session: Session, redis_client: Optional[Redis] = None):
        self.db = db_session
        self.redis = redis_client
        self.cache_ttl = 3600

    def _get_cache_key(self, learner_id: str) -> str:
        return f"adaptive_profile:{learner_id}"

    def get_by_learner_id(self, learner_id: str) -> Optional[AdaptiveProfile]:
        # Safe Redis read with DB fallback
        if self.redis:
            try:
                cache_key = self._get_cache_key(learner_id)
                cached_data = self.redis.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data)
                    return AdaptiveProfile(**data)
            except Exception as e:
                print(f"[Redis Warning] Read failed, falling back to DB: {e}")

        db_profile = self.db.query(AdaptiveProfileModel).filter_by(learner_id=learner_id).first()
        if not db_profile:
            return None

        profile = AdaptiveProfile(
            id=db_profile.id,
            learner_id=db_profile.learner_id,
            path_id=db_profile.path_id,
            current_difficulty=db_profile.current_difficulty,
            accuracy_rate=db_profile.accuracy_rate,
            avg_response_time_ms=db_profile.avg_response_time_ms,
            consecutive_correct=db_profile.consecutive_correct,
            consecutive_incorrect=db_profile.consecutive_incorrect
        )

        self._write_to_cache(profile)
        return profile

    def save(self, profile: AdaptiveProfile) -> None:
        self._write_to_cache(profile)
        db_profile = self.db.query(AdaptiveProfileModel).filter_by(learner_id=profile.learner_id).first()
        if not db_profile:
            db_profile = AdaptiveProfileModel(id=profile.id, learner_id=profile.learner_id)
            self.db.add(db_profile)

        db_profile.path_id = profile.path_id
        db_profile.current_difficulty = profile.current_difficulty
        db_profile.accuracy_rate = profile.accuracy_rate
        db_profile.avg_response_time_ms = profile.avg_response_time_ms
        db_profile.consecutive_correct = profile.consecutive_correct
        db_profile.consecutive_incorrect = profile.consecutive_incorrect

        self.db.commit()

    def _write_to_cache(self, profile: AdaptiveProfile) -> None:
        if not self.redis:
            return
        try:
            cache_key = self._get_cache_key(profile.learner_id)
            data = {
                "id": profile.id,
                "learner_id": profile.learner_id,
                "path_id": profile.path_id,
                "current_difficulty": profile.current_difficulty,
                "accuracy_rate": profile.accuracy_rate,
                "avg_response_time_ms": profile.avg_response_time_ms,
                "consecutive_correct": profile.consecutive_correct,
                "consecutive_incorrect": profile.consecutive_incorrect,
            }
            self.redis.setex(cache_key, self.cache_ttl, json.dumps(data))
        except Exception as e:
            print(f"[Redis Warning] Write failed: {e}")
