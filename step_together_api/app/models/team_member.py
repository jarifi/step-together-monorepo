# # File: app/models/team_member.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from app.db.base import Base
from datetime import datetime

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    joining_date = Column(DateTime, default=datetime.utcnow)