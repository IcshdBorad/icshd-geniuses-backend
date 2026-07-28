from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class CachePort(ABC):
    """
    Cache abstraction.

    Provides a simple key-value cache interface.

    Responsibilities
    ----------------
    - Store cached values.
    - Retrieve cached values.
    - Remove cached values.
    - Clear cache contents.

    Implementations may use:
    - In-memory cache
    - Redis
    - Memcached
    - Distributed cache
    """

    # ---------------------------------------------------------
    # Cache Operations
    # ---------------------------------------------------------

    @abstractmethod
    def get(
        self,
        key: str,
    ) -> Any | None:
        """
        Return the cached value for a key.

        Returns None if the key does not exist.
        """
        ...

    @abstractmethod
    def set(
        self,
        key: str,
        value: Any,
    ) -> None:
        """
        Store a value in the cache.
        """
        ...

    @abstractmethod
    def delete(
        self,
        key: str,
    ) -> None:
        """
        Remove a cached value.
        """
        ...

    @abstractmethod
    def exists(
        self,
        key: str,
    ) -> bool:
        """
        Return whether the key exists.
        """
        ...

    @abstractmethod
    def clear(
        self,
    ) -> None:
        """
        Remove all cached values.
        """
        ...