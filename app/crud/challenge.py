from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime

from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate
from app.models.challenge_team import ChallengeTeam
from app.models.team import Team
from app.models.step_log import StepLog

from app.schema.team import TeamSchema, ChallengeTeamWithSteps

def get_all_challenges(db: Session, skip: int = 0, limit: int = 10) -> List[ChallengeModel]:
    return (
        db.query(ChallengeModel)
        .filter(ChallengeModel.is_deleted == False)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_challenge(db: Session, challenge_id: int) -> Optional[ChallengeModel]:
    return (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )


def get_active_challenge(db: Session, team_id: int) -> ChallengeModel | None:
    now = datetime.utcnow()
    return (
        db.query(ChallengeModel)
        .join(ChallengeTeam, ChallengeModel.id == ChallengeTeam.challenge_id)
        .filter(
            ChallengeTeam.team_id == team_id,
            ChallengeModel.start_date <= now,
            ChallengeModel.end_date >= now,
            ChallengeModel.is_deleted == False,
        )
        .order_by(ChallengeTeam.created_at.desc())
        .first()
    )


def create_challenge(db: Session, challenge_data: ChallengeCreate) -> ChallengeModel:
    db_challenge = ChallengeModel(**challenge_data.model_dump())
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge


def update_challenge(db: Session, challenge_id: int, challenge_data: ChallengeUpdate) -> Optional[ChallengeModel]:
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()
    if not challenge_obj:
        return None

    for key, value in challenge_data.model_dump(exclude_unset=True).items():
        setattr(challenge_obj, key, value)
    
    if challenge_data.is_deleted is not None:
        challenge_obj.is_deleted = challenge_data.is_deleted

    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj


def delete_challenge(db: Session, challenge_id: int) -> Optional[ChallengeModel]:
    challenge_obj = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge_obj:
        return None

    challenge_obj.is_deleted = True
    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj

def get_teams_for_challenge(
    db: Session, challenge_id: int
) -> Optional[List[ChallengeTeamWithSteps]]:
    challenge = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge:
        return None

    results = (
        db.query(
            Team.id.label("id"),
            Team.name.label("name"),
            func.coalesce(func.sum(StepLog.number_of_steps), 0).label("total_steps"),
        )
        .join(ChallengeTeam, ChallengeTeam.team_id == Team.id)
        .outerjoin(
            StepLog,
            and_(
                StepLog.team_id == Team.id,
                StepLog.challenge_id == challenge_id,
            ),
        )
        .filter(ChallengeTeam.challenge_id == challenge_id)
        .group_by(Team.id, Team.name)
        .all()
    )

    return [
        ChallengeTeamWithSteps(
            id=row.id,
            name=row.name,
            total_steps=row.total_steps,
        )
        for row in results
    ]
