from __future__ import annotations

from typing import Protocol


class UnitOfWork(Protocol):
    """
    Transaction boundary.
    """

    def __enter__(self) -> "UnitOfWork":
        ...

    def __exit__(
        self,
        exc_type,
        exc,
        tb,
    ) -> None:
        ...

    def commit(self) -> None:
        ...

    def rollback(self) -> None:
        ...