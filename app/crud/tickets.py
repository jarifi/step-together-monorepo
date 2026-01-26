from sqlalchemy.orm import Session
from app.models.tickets import Ticket
from app.models.ticket_messages import TicketMessage
from app.schema.ticket import TicketCreate, TicketMessageCreate

def create_ticket(db: Session, ticket: TicketCreate, created_by_user_id: int):
    db_ticket = Ticket(title=ticket.title, created_by_user_id=created_by_user_id)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def get_ticket(db: Session, ticket_id: int):
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()

def get_tickets(db: Session, skip: int = 0, limit: int =  100):
    return db.query(Ticket).offset(skip).limit(limit).all()

def create_ticket_message(
    db: Session,
    ticket_id: int,
    sender_id: int,
    sender_type: str,
    message: str,
):
    db_message = TicketMessage(
        ticket_id=ticket_id,
        sender_id=sender_id,
        sender_type=sender_type,
        message=message,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages_for_ticket(db: Session, ticket_id: int):
    return db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).all()

def update_ticket_state(db: Session, ticket_id: int, new_state: str):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None
    ticket.state = new_state
    db.commit()
    db.refresh(ticket)
    return ticket