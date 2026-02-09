from pydantic import BaseModel, Field, StringConstraints, field_validator, ValidationInfo
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Annotated
from app.models.base import CamelCaseBaseModel


class ChallengeState(str, Enum):
    incoming = "incoming"
    open = "open"
    closed = "closed"


class ChallengeBase(CamelCaseBaseModel):
    name: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]
    start_location: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]
    target_location: Annotated[str, StringConstraints(min_length=3, max_length=255, strip_whitespace=True)]
    distance: float = Field(..., gt=0)
    start_date: datetime
    end_date: datetime

    @field_validator("start_date", "end_date")
    def coerce_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)

    @field_validator("end_date")
    def check_dates(cls, v: datetime, info: ValidationInfo) -> datetime:
        start_date = info.data.get("start_date")
        if start_date and v <= start_date:
            raise ValueError("end_date must be after start_date")
        return v


class ChallengeCreate(ChallengeBase):
    creator_id: int


class ChallengeUpdate(CamelCaseBaseModel):
    name: Optional[str] = None
    start_location: Optional[str] = None
    target_location: Optional[str] = None
    distance: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_deleted: Optional[bool] = None


class ChallengeResponse(ChallengeBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    state: ChallengeState  # 👈 computed, read-only


class ChallengeHomeResponse(CamelCaseBaseModel):
    id: int
    name: str
    start_location: str
    target_location: str
    distance: float
    start_date: datetime
    end_date: datetime
    state: ChallengeState
