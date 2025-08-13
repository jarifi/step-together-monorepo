from sqlalchemy.orm import Session
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schema.user import UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash  # We'll define hash_password below


def get_all_users(db: Session):
    return db.query(User).filter(User.is_deleted == False).all()


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,  # Store hashed password
        name=user.name,
        step_length=user.step_length,
        is_active=True,
        is_verified=False
    )
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists (duplicate during commit)."
        )

    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_data: UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    update_data = user_data.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        return None
    
    user.is_deleted = True
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
