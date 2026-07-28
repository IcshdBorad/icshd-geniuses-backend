from __future__ import annotations

from collections import defaultdict
from typing import Any, Callable

from core.application.ports.event_bus import EventBus


class InMemoryEventBus(EventBus):
    """
    In-memory Event Bus implementation.

    Responsibilities
    ----------------
    - Publish events.
    - Publish multiple events.
    - Register event handlers.
    - Remove event handlers.
    - Dispatch events synchronously.

    This implementation is intended for:
    - Development
    - Testing
    - Single-process applications

    It can later be replaced with Kafka, RabbitMQ,
    Redis Streams, or Azure Service Bus without
    changing the application layer.
    """

    def __init__(
        self,
    ) -> None:

        self._handlers: dict[
            type,
            list[Callable[[Any], None]],
        ] = defaultdict(list)

    # ---------------------------------------------------------
    # Publishing
    # ---------------------------------------------------------

    def publish(
        self,
        event: Any,
    ) -> None:
        """
        Publish a single event.
        """

        for handler in self._handlers.get(
            type(event),
            [],
        ):
            handler(event)

    def publish_many(
        self,
        events: list[Any],
    ) -> None:
        """
        Publish multiple events.
        """

        for event in events:
            self.publish(event)

    # ---------------------------------------------------------
    # Subscription
    # ---------------------------------------------------------

    def subscribe(
        self,
        event_type: type,
        handler: Callable[[Any], None],
    ) -> None:
        """
        Register an event handler.
        """

        if handler not in self._handlers[event_type]:
            self._handlers[event_type].append(
                handler,
            )

    def unsubscribe(
        self,
        event_type: type,
        handler: Callable[[Any], None],
    ) -> None:
        """
        Remove an event handler.
        """

        handlers = self._handlers.get(
            event_type,
        )

        if handlers is None:
            return

        if handler in handlers:
            handlers.remove(handler)

        if not handlers:
            self._handlers.pop(
                event_type,
                None,
            )