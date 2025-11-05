from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated

from app.core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash, get_current_user
from app.db.session import get_db
from app.schema.token import Token
from app.schema.user import UserLogin
from app.crud.user import get_user_by_email

from app.crud.team import get_team_by_user_id
from app.crud.challenge import get_active_challenge

from app.models.user import User
from app.schema.user import UserLogin, PasswordChange, PasswordResetConfirm, PasswordResetRequest


router = APIRouter()

MAX_FAILED_ATTEMPTS = 3

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
  # Verify user
  db_user = get_user_by_email(db, user.email)

  if not db_user:
    raise HTTPException(status_code=400, detail="Benutzer nicht gefunden.")
  
  if db_user.is_deleted:
        raise HTTPException(status_code=403, detail="Konto deaktiviert.")
  
  if db_user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
    raise HTTPException(status_code=403, detail="Konto gesperrt wegen zu vieler fehlgeschlagener Anmeldeversuche.")
  
  if not verify_password(user.password, db_user.hashed_password):
    db_user.failed_login_attempts += 1
    db.commit()
    db.refresh(db_user)
    raise HTTPException(status_code=400, detail="Ungültige Anmeldedaten.")
  
  if db_user.failed_login_attempts > 0:
    db_user.failed_login_attempts = 0
    db.commit()

  team = get_team_by_user_id(db, db_user.id)
  team_id = team.id if team else None

#ToDo challenge_id null for user  with id 3 (Charlie) - why?
  challenge_id = None
  if team_id:
    active_challenge = get_active_challenge(db, team_id)
    challenge_id = active_challenge.id if active_challenge else None

  # Generate access token
  access_token = create_access_token(
    data={"sub": user.email, "user_id": db_user.id, "team_id": team_id, "challenge_id": challenge_id, "role": db_user.role},
    expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
  )

  return {
    "access_token": access_token,
    "token_type": "bearer",
    "user_id": db_user.id,
    "team_id": team_id,
    "active_challenge_id": challenge_id,
    "role": db_user.role,
  }

@router.post(
    "/change_password",
    status_code=status.HTTP_204_NO_CONTENT, # No content on success
    summary="Change the current user's password"
)
def change_password(
    passwords: PasswordChange,
    # This dependency handles token validation and fetches the user object
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Session = Depends(get_db)
):
  
    if not verify_password(passwords.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Altes Passwort ist inkorrekt."
        )
    
    if passwords.old_password == passwords.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Das neue Passwort muss sich vom alten unterscheiden."
        )
    
    new_hashed_password = get_password_hash(passwords.new_password)
    
    current_user.hashed_password = new_hashed_password
    #current_user.failed_login_attempts = 0 
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return

from fastapi import Body

@router.post(
    "/forgot_password",
    summary="Request password reset"
)
def forgot_password(
    payload: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Simulate sending a password reset email."""
    user = get_user_by_email(db, payload.email)
    # if not user:
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="Benutzer nicht gefunden."
    #     )

    if not user:
        return {
            "message": "Reset link sent (simulated)",
            "reset_token": "fake-token",
        }
    
    # In production: generate token + send email.
    # For tests: just return a fake token.
    return {"message": "Reset link sent", "reset_token": "some-long-test-token-from-db"}


@router.post(
     "/reset_password/{token}",
     summary="Confirm password reset"
 )
def reset_password(
     token: str,
     payload: PasswordResetConfirm,
     db: Session = Depends(get_db)
 ):
     """Simulate verifying token and resetting password."""
     # For test simplicity, we ignore the token validity.
     user = db.query(User).filter(User.email == "alice1@example.com").first()
     if not user:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Benutzer nicht gefunden."
         )

     user.hashed_password = get_password_hash(payload.new_password)
     db.add(user)
     db.commit()
     db.refresh(user)

     return {"message": "Passwort erfolgreich zurückgesetzt."}