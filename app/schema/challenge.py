#  File: app/schema/challenge.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ChallengeBase(BaseModel):
    """Base schema with common fields"""
    name: str = Field(..., max_length=255, example="Berlin Marathon")
    start_location: str = Field(..., max_length=255, example="Brandenburg Gate")
    target_location: str = Field(..., max_length=255, example="Alexanderplatz")
    distance: float = Field(..., gt=0, example=42.195)
    start_date: datetime = Field(..., example="2023-10-01T09:00:00")
    end_date: datetime = Field(..., example="2023-10-01T15:00:00")
    team_id: int = Field(..., example=1)

class ChallengeCreate(ChallengeBase):
    """Schema for challenge creation (POST requests)"""
    creator_id: int = Field(..., example=1)  # Creator user ID

class ChallengeUpdate(BaseModel):
    """Schema for challenge updates (PATCH/PUT requests)"""
    name: Optional[str] = Field(None, max_length=255, example="Updated Challenge Name")
    start_location: Optional[str] = Field(None, max_length=255)
    target_location: Optional[str] = Field(None, max_length=255)
    distance: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    team_id: Optional[int] = None

class ChallengeResponse(ChallengeBase):
    """Schema for returning challenge data (GET responses)"""
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
   
    model_config = {
        "from_attributes": True,  # replaces orm_mode
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    } 
