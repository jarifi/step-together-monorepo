# File: app/models/challenge_progress.py
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from app.db.base import Base
from datetime import datetime

class ChallengeProgress(Base):
    __tablename__ = "challenge_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    distance_covered = Column(Float, nullable=False)  # was gelaufene_strecke
    total_steps = Column(Integer, nullable=False)     # was insgesamt_schritte
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
