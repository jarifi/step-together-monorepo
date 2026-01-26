from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
from app.models.base import CamelCaseBaseModel

class TicketState(str, Enum):
    open = "open"
    pending = "pending"
    closed = "closed"

class TicketMessageBase(CamelCaseBaseModel):
    message: str

class TicketMessageCreate(CamelCaseBaseModel):
    message: str

class TicketMessage(TicketMessageBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TicketBase(CamelCaseBaseModel):
    title: str

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    state: Optional[str]

    class Config:
        orm_mode = True

class Ticket(TicketBase):
    id: int
    created_by_user_id: int
    state: TicketState
    created_at: datetime
    updated_at: Optional[datetime]
    messages: List[TicketMessage] = []

    class Config:
        orm_mode = True
