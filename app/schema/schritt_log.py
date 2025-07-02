from pydantic import BaseModel
from datetime import datetime

class SchrittLogCreate(BaseModel):
    user_id: int
    challenge_id: int
    team_id: int
    number_of_steps: int

class SchrittLogResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    team_id: int
    date: datetime
    number_of_steps: int

    class Config:
        from_attributes = True