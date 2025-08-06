# File: app/core/security.py
from app.core.config import settings
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import os # Import the os module

from jose import JWTError, jwt
from passlib.context import CryptContext

from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, status, Depends

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schema.token import TokenData

# --- Load environment variables from .env file ---
# This ensures SECRET_KEY is loaded consistently
from dotenv import load_dotenv
# Add debug print statements for dotenv loading
print(f"DEBUG: Current working directory: {os.getcwd()}")
if load_dotenv():
    print("DEBUG: .env file loaded successfully.")
else:
    print("DEBUG: .env file NOT loaded. Check file path and existence.")


# --- JWT Configuration ---
# Get SECRET_KEY from environment variable
SECRET_KEY = settings.SECRET_KEY
if SECRET_KEY is None:
    # Raise an error if the secret key is not set, as it's critical
    print("DEBUG: SECRET_KEY is None after os.getenv()") # Debug print for None case
    raise ValueError("SECRET_KEY environment variable is not set. Please set it in a .env file or your environment.")
else:
    print(f"DEBUG: SECRET_KEY loaded: '{SECRET_KEY}' (Length: {len(SECRET_KEY)})") # Debug print for loaded key

ALGORITHM = settings.ALGORITHM
# Get ACCESS_TOKEN_EXPIRE_MINUTES from environment variable, with a default
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
print(f"DEBUG: ACCESS_TOKEN_EXPIRE_MINUTES loaded: {ACCESS_TOKEN_EXPIRE_MINUTES}") # Debug print for expire minutes


# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# --- Helpers ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

# --- JWT Token Creation ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a new JWT access token.
    'data' dictionary should contain the claims to be encoded (e.g., {"sub": user_email, "user_id": user_id}).
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- JWT Token Decoding ---
def decode_access_token(token: str) -> TokenData:
    """
    Decodes a JWT access token and returns TokenData.
    Raises HTTPException if the token is invalid, expired, or has an invalid payload.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")
        user_id_from_payload = payload.get("user_id")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: 'sub' (email) claim is missing.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user_id_from_payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: 'user_id' claim is missing.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            user_id_int = int(user_id_from_payload)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: 'user_id' claim is not a valid integer.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return TokenData(
            email=email,
            user_id=user_id_int,
            name=payload.get("name"),
            step_length=payload.get("step_length"),
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token processing error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Get Current User Dependency ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.
    """
    token_data = decode_access_token(token)
    # --- ADDED DEBUG PRINT HERE ---
    # --- END DEBUG PRINT ---

    user = db.query(User).filter(User.id == token_data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
