from sqlalchemy import Column, BigInteger, String, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class TicketState(str, enum.Enum):
    open = "open"
    pending = "pending"
    closed = "closed"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_by_user_id = Column(BigInteger, nullable=False)
    title = Column(String(150), nullable=False)
    state = Column(Enum(TicketState), nullable=False, default=TicketState.open)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=True)

    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")
