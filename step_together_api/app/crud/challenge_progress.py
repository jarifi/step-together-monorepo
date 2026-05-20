from sqlalchemy.orm import Session
from app.models.challenge_progress import ChallengeProgress
from app.schema.challenge_progress import ChallengeProgressUpdate

def create_challenge_progress(db: Session, user_id: int, challenge_id: int, progress_data: ChallengeProgressUpdate) -> ChallengeProgress:
    progress = ChallengeProgress(
        user_id=user_id,
        challenge_id=challenge_id,
        distance_covered=progress_data.distance_covered,   # renamed
        total_steps=progress_data.total_steps              # renamed
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

def get_challenge_progress(db: Session, progress_id: int) -> ChallengeProgress | None:
    return db.query(ChallengeProgress).filter(ChallengeProgress.id == progress_id).first()

def get_all_challenge_progresses(db: Session) -> list[ChallengeProgress]:
    return db.query(ChallengeProgress).all()

def update_challenge_progress(db: Session, progress_id: int, progress_data: ChallengeProgressUpdate) -> ChallengeProgress | None:
    progress = db.query(ChallengeProgress).filter(ChallengeProgress.id == progress_id).first()
    if not progress:
        return None
    progress.distance_covered = progress_data.distance_covered   # renamed
    progress.total_steps = progress_data.total_steps             # renamed
    db.commit()
    db.refresh(progress)
    return progress

def delete_challenge_progress(db: Session, progress_id: int) -> bool:
    progress = db.query(ChallengeProgress).filter(ChallengeProgress.id == progress_id).first()
    if not progress:
        return False
    db.delete(progress)
    db.commit()
    return True
