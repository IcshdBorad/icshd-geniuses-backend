from __future__ import annotations

from typing import Any

from core.application.ports.cache_port import CachePort


class InMemoryCache(CachePort):
    """
    In-memory cache implementation.

    Responsibilities
    ----------------
    - Store key-value pairs.
    - Retrieve cached values.
    - Remove cached values.
    - Check key existence.
    - Clear the cache.

    This implementation is intended for:
    - Development
    - Testing
    - Single-process applications

    It is not suitable for distributed deployments.
    """

    def __init__(
        self,
    ) -> None:
        self._cache: dict[str, Any] = {}

    # ---------------------------------------------------------
    # Cache Operations
    # ---------------------------------------------------------

    def get(
        self,
        key: str,
    ) -> Any | None:
        """
        Return the cached value.
        """
        return self._cache.get(key)

    def set(
        self,
        key: str,
        value: Any,
    ) -> None:
        """
        Store a value.
        """
        self._cache[key] = value

    def delete(
        self,
        key: str,
    ) -> None:
        """
        Remove a cached value.
        """
        self._cache.pop(key, None)

    def exists(
        self,
        key: str,
    ) -> bool:
        """
        Return whether the key exists.
        """
        return key in self._cache

    def clear(
        self,
    ) -> None:
        """
        Remove all cached values.
        """
        self._cache.clear()