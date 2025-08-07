from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.base import CamelCaseBaseModel

class StepLogCreate(CamelCaseBaseModel):
    challenge_id: int
    team_id: int
    date: datetime
    number_of_steps: int

class StepLogResponse(CamelCaseBaseModel):
    id: int
    user_id: int
    challenge_id: int
    team_id: int
    date: datetime
    number_of_steps: int

class StepLogUpdate(CamelCaseBaseModel):
    challenge_id: Optional[int] = None
    team_id: Optional[int] = None
    date: Optional[datetime] = None
    number_of_steps: Optional[int] = None

    class Config:
        extra = "forbid"