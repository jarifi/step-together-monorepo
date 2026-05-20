from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schema.user import UserCreate, UserUpdate, UserRegister
from app.core.security import verify_password, get_password_hash


def get_all_users(db: Session, skip: int = 0, limit: int = 10) -> List[User]:
    """
    Retrieve users with pagination.
    :param db: SQLAlchemy Session
    :param skip: Number of records to skip
    :param limit: Number of records to return
    """
    return db.query(User).filter(User.is_deleted == False).offset(skip).limit(limit).all()


def search_users(db: Session, search_term: str, skip: int = 0, limit: int = 100) -> List[User]:
    """
    Search users by name or email.
    :param db: SQLAlchemy Session
    :param search_term: Search query string
    :param skip: Number of records to skip
    :param limit: Number of records to return
    """
    search_pattern = f"%{search_term}%"
    return db.query(User).filter(
        User.is_deleted == False,
        (User.name.ilike(search_pattern)) | (User.email.ilike(search_pattern))
    ).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate | UserRegister):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    hashed_password = get_password_hash(user.password)

    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        step_length=user.step_length,
        is_active=True,
        is_verified=False,
        privacy_policy_accepted=getattr(user, "privacy_policy_accepted", False),
        privacy_policy_accepted_at=(
            datetime.now(timezone.utc)
            if getattr(user, "privacy_policy_accepted", False)
            else None
        )
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
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]

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

    if not user or user.is_deleted:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user