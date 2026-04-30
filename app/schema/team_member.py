# File: app/schema/team_member.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.base import CamelCaseBaseModel

class TeamMemberCreate(CamelCaseBaseModel):
    team_id: int

class TeamMemberAdminCreate(CamelCaseBaseModel):
    team_id: int
    user_id: int

class TeamMemberResponse(CamelCaseBaseModel):
    id: int
    user_id: int
    team_id: int
    joining_date: Optional[datetime] = None

class TeamMemberChallengeSteps(CamelCaseBaseModel):
    id: int
    name: str
    number_of_steps: int

class TeamMemberSimple(CamelCaseBaseModel):
    id: int
    user_id: int
    team_id: int
    joining_date: Optional[datetime] = None
    name: str   

    class Config:
        from_attributes = True
        
class TeamMemberChallengeSteps(BaseModel):
    id: int
    name: str
    numberOfSteps: int
    avatar_url: Optional[str] = None   

    class Config:
        from_attributes = True