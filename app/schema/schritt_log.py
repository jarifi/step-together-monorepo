from pydantic import BaseModel
from datetime import datetime

class SchrittLogCreate(BaseModel):
    user_id: int
    challenge_id: int
    team_id: int
    anzahl_schritte: int

class SchrittLogResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    team_id: int
    datum: datetime
    anzahl_schritte: int

    class Config:
        from_attributes = True