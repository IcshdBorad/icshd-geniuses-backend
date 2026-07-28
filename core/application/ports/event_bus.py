from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class EventBus(ABC):
    """
    Event Bus abstraction.

    Coordinates communication between independent
    application components through domain events.

    Responsibilities
    ----------------
    - Publish domain events.
    - Publish integration events.
    - Subscribe event handlers.
    - Unsubscribe event handlers.

    Implementations may use:
    - In-memory Event Bus
    - RabbitMQ
    - Kafka
    - Redis Streams
    - Azure Service Bus
    - Google Pub/Sub
    """

    # ---------------------------------------------------------
    # Publish
    # ---------------------------------------------------------

    @abstractmethod
    def publish(
        self,
        event: Any,
    ) -> None:
        """
        Publish a single event.
        """
        ...

    @abstractmethod
    def publish_many(
        self,
        events: list[Any],
    ) -> None:
        """
        Publish multiple events.
        """
        ...

    # ---------------------------------------------------------
    # Subscription
    # ---------------------------------------------------------

    @abstractmethod
    def subscribe(
        self,
        event_type: type,
        handler: Any,
    ) -> None:
        """
        Register an event handler.
        """
        ...

    @abstractmethod
    def unsubscribe(
        self,
        event_type: type,
        handler: Any,
    ) -> None:
        """
        Remove an event handler.
        """
        ...