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
    Field(min_length=8, max_length=100),
    AfterValidator(validate_password_complexity)
]

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, pattern="^[a-zA-Z ]+$")
    email: EmailStr
    step_length: Optional[Annotated[float, Field(ge=0, le=200)]] = None
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: PasswordString
    password_confirm: str

    @model_validator(mode='after')
    def passwords_match(self) -> 'UserCreate':
        if self.password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool  # Added to match your database
    created_at: datetime
    updated_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(
        None, min_length=2, max_length=50, pattern="^[a-zA-Z ]+$"
    )
    email: Optional[EmailStr] = None
    step_length: Optional[Annotated[float, Field(ge=0, le=200)]] = None
    password: Optional[PasswordString] = None
    model_config = ConfigDict(from_attributes=True)

class CurrentUser(UserResponse):
    pass

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: PasswordString
    password_confirm: str

    @model_validator(mode='after')
    def passwords_match(self) -> 'PasswordResetConfirm':
        if self.new_password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self

# NEW: Schema for database operations (handles hashed_password)
class UserDB(UserBase):
    id: int
    hashed_password: str  # Matches your database column
    is_active: bool
    is_verified: bool
    verification_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime