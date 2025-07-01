# File: app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

# Import JWT creation and password verification from security module
from app.core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES

# Import database session
from app.db.session import get_db

# Import schemas and CRUD operations
from app.schema.token import Token
from app.schema.user import UserLogin
from app.crud.user import get_user_by_email # Note: verify_password should be from security, not crud


router = APIRouter()

# --- NO DUPLICATE SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token HERE ---
# These are now imported from app.core.security

# --- NO DUPLICATE get_db HERE ---
# It's imported from app.db.session

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    
    # Use verify_password from app.core.security
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Use create_access_token from app.core.security, and its ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data={"sub": user.email, "user_id": db_user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}
