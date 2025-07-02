#   # File: app/schema/team_member.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TeamMemberCreate(BaseModel):
    user_id: int
    team_id: int

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    joining_date: Optional[datetime] = None

    class Config:
        from_attributes = True