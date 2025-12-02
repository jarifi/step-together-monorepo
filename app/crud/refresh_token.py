from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.refresh_token import RefreshToken
from typing import Optional
def create_db_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime):
    db_token = RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def validate_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    return db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).first()

def revoke_refresh_token(db: Session, token: str):
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()

    if db_token:
        db_token.revoked = True
        db.commit()
