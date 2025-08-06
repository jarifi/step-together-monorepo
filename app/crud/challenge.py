from sqlalchemy.orm import Session
from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate, ChallengeResponse

def get_all_challenges(db: Session):
    return db.query(ChallengeModel).all()

def get_challenge(db: Session, challenge_id: int):
    return db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()

def get_active_challenge(db: Session, team_id: int) -> ChallengeModel | None:
    return db.query(ChallengeModel).filter(
        ChallengeModel.team_id == team_id,
        ChallengeModel.state == "open"
    ).first()

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
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()
    if not challenge_obj:
        return False
    db.delete(challenge_obj)
    db.commit()
    return True