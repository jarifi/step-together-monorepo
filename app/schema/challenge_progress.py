# # File: app/schema/challenge_progress.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChallengeProgressUpdate(BaseModel):
    gelaufene_strecke: float
    insgesamt_schritte: int

class ChallengeProgressResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    gelaufene_strecke: float
    insgesamt_schritte: int
    updated_at: datetime

    class Config:
        from_attributes = True