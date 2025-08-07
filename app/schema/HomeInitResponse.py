from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schema.user import UserResponse  # Assuming you have a UserOut schema
from app.schema.team import TeamResponse  # Assuming you have a TeamOut schema
from app.schema.challenge import ChallengeHomeResponse  # Assuming you have a ChallengeOut schema

class HomeInitResponse(BaseModel):
    user: UserResponse  # or whatever your user model is
    team: Optional[TeamResponse]
    challenge: Optional[ChallengeHomeResponse]
