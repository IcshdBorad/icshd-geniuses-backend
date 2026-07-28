from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from core.infrastructure.database.base import Base

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

DATABASE_URL = "sqlite:///./icshd.db"

# ---------------------------------------------------------
# Engine
# ---------------------------------------------------------

engine: Engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

# ---------------------------------------------------------
# Session Factory
# ---------------------------------------------------------

SessionFactory = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)

# ---------------------------------------------------------
# Schema Management
# ---------------------------------------------------------

def create_database() -> None:
    """
    Create all database tables.

    This function should be called once during
    application startup.
    """

    Base.metadata.create_all(
        bind=engine,
    )


def drop_database() -> None:
    """
    Drop all database tables.

    Intended for:
    - Testing
    - Local development

    Never call this in production.
    """

    Base.metadata.drop_all(
        bind=engine,
    )


# ---------------------------------------------------------
# Session Provider
# ---------------------------------------------------------

def get_session() -> Generator[
    Session,
    None,
    None,
]:
    """
    Provide a transactional SQLAlchemy session.

    The caller is responsible for committing
    or rolling back the transaction.

    Example
    -------
    with next(get_session()) as session:
        ...
    """

    session = SessionFactory()

    try:
        yield session

    finally:
        session.close()