# # File: app/models/challenge.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.base import Base
from datetime import datetime


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_ort = Column(String(255), nullable=False)
    ziel_ort = Column(String(255), nullable=False)
    streckenlaenge = Column(Float, nullable=False)
    start_datum = Column(DateTime, nullable=False)
    end_datum = Column(DateTime, nullable=False)
    ersteller_id = Column(Integer)
    team_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)