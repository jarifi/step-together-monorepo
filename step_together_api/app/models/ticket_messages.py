from sqlalchemy import Column, BigInteger, String, Enum, ForeignKey, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class SenderType(str, enum.Enum):
    user = "user"
    admin = "admin"

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BigInteger, nullable=False)
    sender_type = Column(Enum(SenderType), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)

    ticket = relationship("Ticket", back_populates="messages")