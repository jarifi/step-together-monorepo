from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.session import get_db
from app.schema.token import Token
from app.schema.user import UserLogin
from app.crud.user import get_user_by_email

from app.crud.team import get_team_by_user_id
from app.crud.challenge import get_active_challenge


router = APIRouter()

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
  # Verify user
  db_user = get_user_by_email(db, user.email)
  if not db_user or not verify_password(user.password, db_user.hashed_password):
    raise HTTPException(status_code=400, detail="Invalid credentials")

  team = get_team_by_user_id(db, db_user.id)
  team_id = team.id if team else None

  challenge_id = None
  if team_id:
    active_challenge = get_active_challenge(db, team_id)
    challenge_id = active_challenge.id if active_challenge else None

  # Generate access token
  access_token = create_access_token(
    data={"sub": user.email, "user_id": db_user.id, "team_id": team_id, "challenge_id": challenge_id},
    expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
  )

  return {
    "access_token": access_token,
    "token_type": "bearer",
    "user_id": db_user.id,
    "team_id": team_id,
    "active_challenge_id": challenge_id,
  }
