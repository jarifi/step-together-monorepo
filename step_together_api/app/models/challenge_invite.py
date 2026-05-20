from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer

from app.db.base import Base


class ChallengeInvite(Base):
    __tablename__ = "challenge_invites"

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"
    STATUS_CANCELLED = "cancelled"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    inviter_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitee_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        Enum(
            STATUS_PENDING,
            STATUS_ACCEPTED,
            STATUS_DECLINED,
            STATUS_CANCELLED,
            name="challenge_invite_status",
            native_enum=False,
        ),
        nullable=False,
        default=STATUS_PENDING,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
