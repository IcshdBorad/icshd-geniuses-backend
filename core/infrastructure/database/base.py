from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.

    Responsibilities
    ----------------
    - Own the application's metadata registry.
    - Serve as the parent class for every ORM model.
    - Enable automatic table registration.

    Notes
    -----
    Every SQLAlchemy model in the application must inherit
    from this class.

    Example
    -------
    class LearnerModel(Base):
        __tablename__ = "learners"
        ...
    """

    pass