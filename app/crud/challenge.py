from sqlalchemy.orm import Session
from typing import List
from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate, ChallengeResponse
from app.models.challenge_team import ChallengeTeam
from datetime import datetime

def get_all_challenges(db: Session, skip: int = 0, limit: int = 10)-> List[ChallengeModel]:
    """
    Retrieve challenges with pagination.
    :param db: SQLAlchemy Session
    :param skip: Number of records to skip
    :param limit: Number of records to return
    """
    return db.query(ChallengeModel).filter(ChallengeModel.is_deleted == False).offset(skip).limit(limit).all()

def get_challenge(db: Session, challenge_id: int):
    return db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id, ChallengeModel.is_deleted == False).first()

def get_active_challenge(db: Session, team_id: int) -> ChallengeModel | None:
    now = datetime.utcnow()
    return (
        db.query(ChallengeModel)
        .join(ChallengeTeam, ChallengeModel.id == ChallengeTeam.challenge_id)
        .filter(
            ChallengeTeam.team_id == team_id,
            ChallengeModel.start_date <= now,
            ChallengeModel.end_date >= now,
            ChallengeModel.is_deleted == False
        )
        .order_by(ChallengeTeam.created_at.desc())
        .first()
    )

def create_challenge(db: Session, challenge_data: ChallengeCreate):
    db_challenge = ChallengeModel(**challenge_data.model_dump())
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

def update_challenge(db: Session, challenge_id: int, challenge_data: ChallengeUpdate):
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()
    if not challenge_obj:
        return None
    for key, value in challenge_data.model_dump(exclude_unset=True).items():
        setattr(challenge_obj, key, value)
    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj

def delete_challenge(db: Session, challenge_id: int):
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id, ChallengeModel.is_deleted == False).first()
    if not challenge_obj:
        return None
    
    challenge_obj.is_deleted = True
    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj