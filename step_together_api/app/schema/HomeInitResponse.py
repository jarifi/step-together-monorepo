from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schema.user import UserResponse
from app.schema.team import TeamResponse
from app.schema.challenge import ChallengeHomeResponse
from app.schema.step_log import StepDashboardResponse  # <-- your Pydantic schema for step logs

class UserDashboardResponse(BaseModel):
    user: UserResponse
    team: Optional[TeamResponse]
    challenge: Optional[ChallengeHomeResponse]
    steps_this_week: Optional[List[StepDashboardResponse]]  # <-- just a list of integers now

    class Config:
        orm_mode = True
