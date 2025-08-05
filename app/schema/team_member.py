#   # File: app/schema/team_member.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.base import CamelCaseBaseModel

class TeamMemberCreate(CamelCaseBaseModel):
    user_id: int
    team_id: int

class TeamMemberResponse(CamelCaseBaseModel):
    id: int
    user_id: int
    team_id: int
    joining_date: Optional[datetime] = None

    model_config = {
        "from_attributes": True,  # replaces orm_mode
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    } 
