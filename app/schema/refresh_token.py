from pydantic import BaseModel
from datetime import datetime

class RefreshTokenCreate(BaseModel):
    token: str
    expires_at: datetime
    user_id: int

class RefreshTokenRead(BaseModel):
    id: int
    token: str
    expires_at: datetime
    revoked: bool
    user_id: int

    model_config = {"from_attributes": True}
