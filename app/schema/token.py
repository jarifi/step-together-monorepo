from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    name: Optional[str] = None # Include if you expect 'name' in payload
    schrittlaenge: Optional[float] = None # Include if you expect 'schrittlaenge' in payload
