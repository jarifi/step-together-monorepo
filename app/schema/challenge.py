from pydantic import BaseModel, Field, StringConstraints, field_validator, ValidationInfo
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Annotated, List
from app.models.base import CamelCaseBaseModel


class ChallengeState(str, Enum):
    incoming = "incoming"
    open = "open"
    closed = "closed"


class ChallengeMode(str, Enum):
    team = "team"
    individual = "individual"


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
    creator_id: Optional[int] = None
    team_ids: List[int] = Field(default_factory=list)
    mode: ChallengeMode = ChallengeMode.team


class ChallengeUpdate(CamelCaseBaseModel):
    name: Optional[str] = None
    start_location: Optional[str] = None
    target_location: Optional[str] = None
    distance: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_deleted: Optional[bool] = None
    team_ids: Optional[List[int]] = None
    mode: Optional[ChallengeMode] = None


class ChallengeResponse(ChallengeBase):
    id: int
    creator_id: int
    mode: ChallengeMode
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
    mode: ChallengeMode
    state: ChallengeState


class ChallengeParticipantWithSteps(CamelCaseBaseModel):
    user_id: int
    name: str
    total_steps: int


class ActiveChallengeInfo(CamelCaseBaseModel):
    id: int
    name: str
    mode: ChallengeMode
    state: ChallengeState
    start_date: datetime
    end_date: datetime


class ChallengeJoinRequest(CamelCaseBaseModel):
    team_id: Optional[int] = None


class ChallengeJoinResponse(CamelCaseBaseModel):
    challenge_id: int
    user_id: int
    mode: ChallengeMode
    registration: str
    team_id: Optional[int] = None


class ChallengeInviteCreate(CamelCaseBaseModel):
    invitee_user_id: int
    expires_at: Optional[datetime] = None


class ChallengeInviteResponse(CamelCaseBaseModel):
    id: int
    challenge_id: int
    inviter_user_id: int
    invitee_user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
