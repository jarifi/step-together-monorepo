#  File: app/schema/challenge.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ChallengeBase(BaseModel):
    """Base schema with common fields"""
    name: str = Field(..., max_length=255, example="Berlin Marathon")
    start_ort: str = Field(..., max_length=255, example="Brandenburg Gate")
    ziel_ort: str = Field(..., max_length=255, example="Alexanderplatz")
    streckenlaenge: float = Field(..., gt=0, example=42.195)
    start_datum: datetime = Field(..., example="2023-10-01T09:00:00")
    end_datum: datetime = Field(..., example="2023-10-01T15:00:00")
    team_id: int = Field(..., example=1)

class ChallengeCreate(ChallengeBase):
    """Schema for challenge creation (POST requests)"""
    ersteller_id: int = Field(..., example=1)  # Creator user ID

class ChallengeUpdate(BaseModel):
    """Schema for challenge updates (PATCH/PUT requests)"""
    name: Optional[str] = Field(None, max_length=255, example="Updated Challenge Name")
    start_ort: Optional[str] = Field(None, max_length=255)
    ziel_ort: Optional[str] = Field(None, max_length=255)
    streckenlaenge: Optional[float] = Field(None, gt=0)
    start_datum: Optional[datetime] = None
    end_datum: Optional[datetime] = None
    team_id: Optional[int] = None

class ChallengeResponse(ChallengeBase):
    """Schema for returning challenge data (GET responses)"""
    id: int
    ersteller_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enables ORM mode (previously called orm_mode)