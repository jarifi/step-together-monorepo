from pydantic import BaseModel
from typing import Optional

# --- Response returned after login or refresh ---
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None  # included for refresh token support
    token_type: str = "bearer"
    user_id: int
    team_id: Optional[int] = None
    active_challenge_id: Optional[int] = None
    role: str

    model_config = {
        "from_attributes": True,
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    }

# --- JWT payload data ---
class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    name: Optional[str] = None
    step_length: Optional[float] = None
    team_id: Optional[int] = None
    challenge_id: Optional[int] = None
    role: Optional[str] = None

    model_config = {
        "from_attributes": True,  # ORM mode
        "alias_generator": lambda field: ''.join(
            [word if i == 0 else word.capitalize() for i, word in enumerate(field.split('_'))]
        ),
        "populate_by_name": True
    }

# --- Request for refresh token ---
class RefreshTokenRequest(BaseModel):
    refresh_token: str

# --- Response for refresh token endpoint ---
class RefreshTokenResponse(Token):
    pass  # same as Token, includes access + refresh token and claims
