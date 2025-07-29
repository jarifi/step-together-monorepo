from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StepLogCreate(BaseModel):
    user_id: int
    challenge_id: int
    team_id: int
    date: datetime
    number_of_steps: int

class StepLogResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    team_id: int
    date: datetime
    number_of_steps: int

    class Config:
        from_attributes = True

class StepLogUpdate(BaseModel):
    user_id: Optional[int] = None
    challenge_id: Optional[int] = None
    team_id: Optional[int] = None
    date: Optional[datetime] = None
    number_of_steps: Optional[int] = None