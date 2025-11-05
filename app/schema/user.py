# File: app/schema/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator, StringConstraints
from pydantic.functional_validators import AfterValidator
from datetime import datetime
from typing import Optional, Annotated
import re
from app.models.base import CamelCaseBaseModel

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

class UserBase(CamelCaseBaseModel):
    name: Annotated[ 
        str,
        StringConstraints(
            min_length=2,
            max_length=50,
            strip_whitespace=True
        )
     ]= Field(
        ...,
        pattern=r"^[a-zA-ZäöüÄÖÜß '\-]+$",
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

class UserResponse(CamelCaseBaseModel):
    id: int
    name: str
    email: EmailStr
    step_length: Optional[float] = None

class UserLogin(CamelCaseBaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})
    password: str = Field(
        ..., 
        min_length=8,
        json_schema_extra={"example": "Str0ngPass!"}
    )

class UserUpdate(CamelCaseBaseModel):
    name: Optional[
        Annotated[ 
        str,
        StringConstraints(
            min_length=2,
            max_length=50,
            strip_whitespace=True
        )
     ]] = Field(
        None, 
        pattern=r"^[a-zA-ZäöüÄÖÜß '\-]+$",
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
    model_config = ConfigDict(from_attributes=True)

class CurrentUser(UserResponse):
    pass

class PasswordResetRequest(CamelCaseBaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})

class PasswordResetConfirm(CamelCaseBaseModel):
    #token: str = Field(json_schema_extra={"example": "reset-token-123"})
    new_password: PasswordString
    password_confirm: str = Field(json_schema_extra={"example": "NewStr0ngPass!"})

    @model_validator(mode='after')
    def passwords_match(self) -> 'PasswordResetConfirm':
        if self.new_password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self
    
class PasswordChange(BaseModel):
    old_password: str
    new_password: str