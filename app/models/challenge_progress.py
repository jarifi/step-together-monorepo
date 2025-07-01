#  File: app/models/challenge_progress.py
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from app.db.base import Base
from datetime import datetime

class ChallengeProgress(Base):
    __tablename__ = "challenge_progresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    gelaufene_strecke = Column(Float, nullable=False)
    insgesamt_schritte = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)