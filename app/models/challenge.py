# # File: app/models/challenge.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.base import Base
from datetime import datetime


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_location = Column(String(255), nullable=False)
    target_location = Column(String(255), nullable=False)
    distance = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    creator_id = Column(Integer)
    team_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    state = Column(String(50), default="incoming")  # Possible values: incoming, open, closed