#  File: app/schema/challenge.py
from pydantic import BaseModel, Field, StringConstraints, field_validator, ValidationInfo
from datetime import datetime
from enum import Enum
from typing import Optional, Annotated
from app.models.base import CamelCaseBaseModel

class ChallengeState (str, Enum):
    incoming = "incoming"
    open = "open"
    closed = "closed"

class ChallengeBase(CamelCaseBaseModel):
    """Base schema with common fields"""
    name: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)] = Field(..., example="Berlin Marathon")
    start_location: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)] = Field(..., max_length=255, example="Brandenburg Gate")
    target_location: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)] = Field(..., max_length=255, example="Alexanderplatz")
    distance: float = Field(..., gt=0, example=42.195)
    start_date: datetime = Field(..., example="2023-10-01T09:00:00")
    end_date: datetime = Field(..., example="2023-10-01T15:00:00")
    team_id: int = Field(..., example=1)
    state: ChallengeState = Field(default=ChallengeState.incoming, description="Possible values: incoming, open, closed")

    @field_validator("end_date")
    def check_dates(cls, v: datetime, info: ValidationInfo) -> datetime:
        start_date = info.data.get("start_date")
        if start_date and v <= start_date:
            raise ValueError("end_date must be after start_date")
        return v

class ChallengeCreate(ChallengeBase):
    """Schema for challenge creation (POST requests)"""
    creator_id: int = Field(..., example=1)  # Creator user ID

class ChallengeUpdate(CamelCaseBaseModel):
    """Schema for challenge updates (PATCH/PUT requests)"""
    name: Optional[Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]] = None
    start_location: Optional[Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]] = None
    target_location: Optional[Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]] = None
    distance: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    team_id: Optional[int] = None
    state: Optional[ChallengeState] = Field(None, example="open", description="Possible values: incoming, open, closed")

class ChallengeResponse(ChallengeBase):
    """Schema for returning challenge data (GET responses)"""
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime


class ChallengeHomeResponse(CamelCaseBaseModel):
    """Base schema with common fields"""
    id: int
    name: str = Field(..., max_length=255, example="Berlin Marathon")
    start_location: str = Field(..., max_length=255, example="Brandenburg Gate")
    target_location: str = Field(..., max_length=255, example="Alexanderplatz")
    distance: float = Field(..., gt=0, example=42.195)
    start_date: datetime = Field(..., example="2023-10-01T09:00:00")
    end_date: datetime = Field(..., example="2023-10-01T15:00:00")
    team_id: int = Field(..., example=1)
    state: Optional[str] = Field("incoming", example="incoming", description="Possible values: incoming, open, closed")
