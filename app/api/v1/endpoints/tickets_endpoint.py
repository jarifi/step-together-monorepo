from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud import tickets as crud_tickets
from app.schema.ticket import TicketCreate, Ticket, TicketMessageCreate, TicketMessage, TicketUpdate
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["tickets"])

@router.post("/", response_model=Ticket)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return crud_tickets.create_ticket(db=db, ticket=ticket, created_by_user_id=current_user.id,)

@router.get("/", response_model=list[Ticket])
def read_all_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_tickets.get_tickets(db, skip, limit)

@router.get("/{ticket_id}", response_model=Ticket)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = crud_tickets.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.post("/{ticket_id}/messages", response_model=TicketMessage)
def add_message(ticket_id: int, message: TicketMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return crud_tickets.create_ticket_message(        db=db,
        ticket_id=ticket_id,
        sender_id=current_user.id,
        sender_type=current_user.role,
        message=message.message,)

@router.get("/{ticket_id}/messages", response_model=list[TicketMessage])
def list_messages(ticket_id: int, db: Session = Depends(get_db)):
    return crud_tickets.get_messages_for_ticket(db, ticket_id)

@router.put("/{ticket_id}", response_model=Ticket)
def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = crud_tickets.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Optional: only allow the creator or an admin to close/update tickets
    # if ticket.created_by_user_id != current_user.id and current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

    updated_ticket = crud_tickets.update_ticket_state(db, ticket_id, ticket_update.state)
    return updated_ticket