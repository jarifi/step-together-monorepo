# File: app/schema/team.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.base import CamelCaseBaseModel

class TeamCreate(CamelCaseBaseModel):
    name: str

class TeamResponse(CamelCaseBaseModel):
    id: int
    name: str

class TeamUpdate(CamelCaseBaseModel):
    name: Optional[str] = None

class TeamSchema(CamelCaseBaseModel):
    id: int | None = None
    name: str
    creator_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
        
    model_config = {
        "from_attributes": True,  # replaces orm_mode
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    } 
