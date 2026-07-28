from __future__ import annotations

from types import TracebackType

from core.application.ports.unit_of_work import UnitOfWork


class MemoryUnitOfWork(UnitOfWork):
    """
    In-memory implementation of Unit of Work.

    Since in-memory repositories persist changes immediately,
    no real transactional behavior is required.

    This implementation preserves the same API used by production
    database implementations.
    """

    def __init__(self) -> None:
        self.committed: bool = False
        self.rolled_back: bool = False

    def __enter__(self) -> MemoryUnitOfWork:
        self.begin()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        if exc is None:
            self.commit()
        else:
            self.rollback()

    # ---------------------------------------------------------
    # Transaction API
    # ---------------------------------------------------------

    def begin(self) -> None:
        """
        Begin a transaction.
        """
        self.committed = False
        self.rolled_back = False

    def commit(self) -> None:
        """
        Commit the transaction.
        """
        self.committed = True

    def rollback(self) -> None:
        """
        Roll back the transaction.
        """
        self.rolled_back = True