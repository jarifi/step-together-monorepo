# File: app/schema/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from pydantic.functional_validators import AfterValidator
from datetime import datetime
from typing import Optional, Annotated
import re

# Password complexity check
def validate_password_complexity(password: str) -> str:
    """Enforces password complexity rules."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    return password

# Reusable password type
PasswordString = Annotated[
    str, 
    Field(min_length=8, max_length=100, json_schema_extra={"example": "Str0ngPass!"}),
    AfterValidator(validate_password_complexity)
]

class UserBase(BaseModel):
    name: str = Field(
        ..., 
        min_length=2, 
        max_length=50, 
        pattern="^[a-zA-Z ]+$",
        json_schema_extra={"example": "John Doe"}
    )
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})
    step_length: Optional[Annotated[float, Field(
        ge=0, 
        le=200,
        json_schema_extra={"example": 75.0}
    )]] = None
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: PasswordString
    password_confirm: str = Field(
        ...,
        json_schema_extra={"example": "Str0ngPass!"}
    )

    @model_validator(mode='after')
    def passwords_match(self) -> 'UserCreate':
        if self.password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self

class UserResponse(UserBase):
    id: int = Field(json_schema_extra={"example": 1})
    is_active: bool = Field(json_schema_extra={"example": True})
    is_verified: bool = Field(json_schema_extra={"example": False})
    created_at: datetime = Field(json_schema_extra={"example": "2023-01-01T00:00:00"})
    updated_at: datetime = Field(json_schema_extra={"example": "2023-01-01T00:00:00"})

class UserLogin(BaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})
    password: str = Field(
        ..., 
        min_length=8,
        json_schema_extra={"example": "Str0ngPass!"}
    )

class UserUpdate(BaseModel):
    name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=50, 
        pattern="^[a-zA-Z ]+$",
        json_schema_extra={"example": "New Name"}
    )
    email: Optional[EmailStr] = Field(
        None,
        json_schema_extra={"example": "new.email@example.com"}
    )
    step_length: Optional[Annotated[float, Field(
        ge=0, 
        le=200,
        json_schema_extra={"example": 80.0}
    )]] = None
    password: Optional[PasswordString] = None
    model_config = ConfigDict(from_attributes=True)

class CurrentUser(UserResponse):
    pass

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})

class PasswordResetConfirm(BaseModel):
    token: str = Field(json_schema_extra={"example": "reset-token-123"})
    new_password: PasswordString
    password_confirm: str = Field(json_schema_extra={"example": "NewStr0ngPass!"})

    @model_validator(mode='after')
    def passwords_match(self) -> 'PasswordResetConfirm':
        if self.new_password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self

class UserDB(UserBase):
    id: int
    hashed_password: str = Field(json_schema_extra={"example": "$2b$12$..."})
    is_active: bool
    is_verified: bool
    verification_token: Optional[str] = Field(
        None,
        json_schema_extra={"example": "verification-token-123"}
    )
    password_reset_token: Optional[str] = Field(
        None,
        json_schema_extra={"example": "reset-token-456"}
    )
    failed_login_attempts: int = Field(
        0,
        json_schema_extra={"example": 0}
    )
    locked_until: Optional[datetime] = Field(
        None,
        json_schema_extra={"example": None}
    )
    created_at: datetime
    updated_at: datetime