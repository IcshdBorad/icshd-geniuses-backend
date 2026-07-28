from __future__ import annotations

from typing import List, Optional
from sqlalchemy.orm import Session
from core.application.ports.attempt_repository import AttemptRepository
from packages.contracts.attempt import Attempt


class SQLAlchemyAttemptRepository(AttemptRepository):
    """Production-grade relational persistence provider."""

    def __init__(self, db_session: Session) -> None:
        self._session = db_session

    def save(self, attempt: Attempt) -> None:
        self._session.add(attempt)
        # UnitOfWork handles commit()

    def get(self, identifier: str) -> Optional[Attempt]:
        return self._session.query(Attempt).filter_by(identifier=identifier).first()

    def list_by_learner(self, learner_id: str) -> List[Attempt]:
        return (
            self._session.query(Attempt)
            .filter_by(learner_id=learner_id)
            .order_by(Attempt.created_at.desc())
            .all()
        )