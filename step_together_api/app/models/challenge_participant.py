from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"

    STATUS_ACTIVE = "active"
    STATUS_LEFT = "left"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        Enum(STATUS_ACTIVE, STATUS_LEFT, name="challenge_participant_status", native_enum=False),
        nullable=False,
        default=STATUS_ACTIVE,
    )
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("challenge_id", "user_id", name="uq_challenge_participant"),
    )
