# File: app/schema/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator, StringConstraints, field_validator
from pydantic.functional_validators import AfterValidator
from datetime import datetime
from typing import Optional, Annotated
import re
from app.models.base import CamelCaseBaseModel

# Password complexity check
def validate_password_complexity(password: str) -> str:
    """Enforces password complexity rules."""
    if len(password) < 12:
        raise ValueError("Das Passwort muss mindestens 12 Zeichen lang sein.")
    if len(password) > 20:
        raise ValueError("Das Passwort darf maximal 20 Zeichen lang sein.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Das Passwort muss mindestens einen Großbuchstaben enthalten.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Das Passwort muss mindestens einen Kleinbuchstaben enthalten.")
    if not re.search(r"\d", password):
        raise ValueError("Das Passwort muss mindestens eine Zahl enthalten.")
    if " " in password:
        raise ValueError("Das Passwort darf keine Leerzeichen enthalten.")
    if not re.match(r"^[a-zA-Z0-9!.#$%&*(),?/\-_@#]+$", password):
        raise ValueError("Das Passwort enthält unerlaubte Zeichen. Erlaubt sind: ! . $ % & * ( ) , ? / - _ @ #")
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
    ] = Field(
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

class UserRegister(UserCreate):
    privacy_policy_accepted: bool = Field(
        ...,
        description="Must be true to complete registration.",
        json_schema_extra={"example": True}
    )

    @model_validator(mode='after')
    def privacy_policy_must_be_accepted(self) -> 'UserRegister':
        if self.privacy_policy_accepted is not True:
            raise ValueError('Privacy policy must be accepted')
        return self

class UserResponse(CamelCaseBaseModel):
    id: int
    name: str
    email: EmailStr
    step_length: Optional[float] = None
    is_active: bool = True
    is_deleted: bool = False
    is_verified: bool = False
    avatar_url: Optional[str] = None
    failed_login_attempts: int = 0

class UserLogin(CamelCaseBaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})
    password: str = Field(..., json_schema_extra={"example": "Str0ngPass!"})

    @field_validator("password")
    @classmethod
    def validate_password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Das Passwort muss mindestens 8 Zeichen lang sein.")
        return v

class UserUpdate(CamelCaseBaseModel):
    name: Optional[
        Annotated[
            str,
            StringConstraints(
                min_length=2,
                max_length=50,
                strip_whitespace=True
            )
        ]
    ] = Field(
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
    is_active: Optional[bool] = None
    is_deleted: Optional[bool] = None
    is_verified: Optional[bool] = None
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CurrentUser(UserResponse):
    pass

class PasswordResetRequest(CamelCaseBaseModel):
    email: EmailStr = Field(json_schema_extra={"example": "user@example.com"})

class PasswordResetConfirm(CamelCaseBaseModel):
    new_password: PasswordString
    password_confirm: str = Field(json_schema_extra={"example": "NewStr0ngPass!"})

    @model_validator(mode='after')
    def passwords_match(self) -> 'PasswordResetConfirm':
        if self.new_password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self

class PasswordChange(CamelCaseBaseModel):
    old_password: str = Field(..., description="Das aktuelle Passwort")
    new_password: PasswordString

    @model_validator(mode='after')
    def validate_different_passwords(self) -> 'PasswordChange':
        if self.old_password == self.new_password:
            raise ValueError('Das neue Passwort darf nicht identisch mit dem alten sein.')
        return self