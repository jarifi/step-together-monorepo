from sqlalchemy import Column, Integer, ForeignKey, DateTime, PrimaryKeyConstraint
from app.db.base import Base
from datetime import datetime

class ChallengeTeam(Base):
    __tablename__ = "challenge_team"

    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        PrimaryKeyConstraint("challenge_id", "team_id"),
    )