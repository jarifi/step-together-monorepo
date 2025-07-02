# File: app/schema/challenge_progress.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChallengeProgressUpdate(BaseModel):
    distance_covered: float  # was gelaufene_strecke
    total_steps: int         # was insgesamt_schritte

class ChallengeProgressResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    distance_covered: float  # was gelaufene_strecke
    total_steps: int         # was insgesamt_schritte
    updated_at: datetime

    class Config:
        from_attributes = True
