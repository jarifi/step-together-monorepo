# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Enum
from app.db.base import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)  # Changed from password
    step_length = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    verification_token = Column(String(100), nullable=True)
    password_reset_token = Column(String(100), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    role = Column(Enum('admin', 'user'), default='user', nullable=False)