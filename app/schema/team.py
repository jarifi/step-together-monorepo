from pydantic import BaseModel, StringConstraints
from typing import Optional, Annotated
from datetime import datetime
from app.models.base import CamelCaseBaseModel

class TeamCreate(CamelCaseBaseModel):
    name: Annotated[
        str, 
        StringConstraints(min_length=3, max_length=255, strip_whitespace=True)
    ]

class TeamResponse(CamelCaseBaseModel):
    id: int
    name: str

class TeamUpdate(CamelCaseBaseModel):
    name: Optional[
        Annotated[
            str, 
            StringConstraints(min_length=3, max_length=255, strip_whitespace=True)
        ]
    ] = None

class TeamSchema(CamelCaseBaseModel):
    id: int | None = None
    name: str
    creator_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
        
    model_config = {
        "from_attributes": True,  
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    } 

class AddUserToTeamRequest(CamelCaseBaseModel):
    user_id: int


class ChallengeTeamWithSteps(CamelCaseBaseModel):
    id: int
    name: str
    total_steps: int 

    model_config = {
        "from_attributes": False,
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    }
