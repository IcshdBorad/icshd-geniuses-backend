from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    """
    Base API schema.

    Shared configuration for every
    API request/response model.
    """

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        populate_by_name=True,
    )


class MessageResponse(APIModel):
    """
    Generic message response.
    """

    message: str


class IdentifierResponse(APIModel):
    """
    Generic identifier response.
    """

    identifier: str