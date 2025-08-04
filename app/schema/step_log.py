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

    
    model_config = {
        "from_attributes": True,  # replaces orm_mode
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    } 


class StepLogUpdate(BaseModel):
    user_id: Optional[int] = None
    challenge_id: Optional[int] = None
    team_id: Optional[int] = None
    date: Optional[datetime] = None
    number_of_steps: Optional[int] = None