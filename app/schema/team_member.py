#   # File: app/schema/team_member.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.base import CamelCaseBaseModel

class TeamMemberCreate(CamelCaseBaseModel):
    team_id: int

class TeamMemberResponse(CamelCaseBaseModel):
    id: int
    user_id: int
    team_id: int
    joining_date: Optional[datetime] = None

class TeamMemberChallengeSteps(CamelCaseBaseModel):
    id: int
    name: str
    number_of_steps: int
