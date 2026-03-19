# app/crud/challenge.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError

from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate
from app.models.challenge_team import ChallengeTeam
from app.models.team import Team
from app.models.step_log import StepLog
from app.models.team_member import TeamMember

from app.schema.team import ChallengeTeamWithSteps


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


def get_active_challenge(db: Session, team_id: int):
    now = datetime.now(timezone.utc)
    return (
        db.query(ChallengeModel)
        .outerjoin(ChallengeTeam, ChallengeModel.id == ChallengeTeam.challenge_id)
        .filter(
            or_(ChallengeTeam.team_id == team_id, ChallengeModel.team_id == team_id),
            ChallengeModel.is_deleted == False,
            ChallengeModel.start_date <= now,
            ChallengeModel.end_date >= now,
        )
        .first()
    )


def create_challenge(db: Session, challenge_data: ChallengeCreate) -> ChallengeModel:
    overlapping_challenge = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.is_deleted == False,
            ChallengeModel.start_date <= challenge_data.end_date,
            ChallengeModel.end_date >= challenge_data.start_date,
        )
        .first()
    )

    if overlapping_challenge:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Challenge within this time frame already exists."
        )

    try:
        challenge_dict = challenge_data.model_dump()
        team_ids = challenge_dict.pop("team_ids", None)

        db_challenge = ChallengeModel(**challenge_dict)
        db.add(db_challenge)
        db.flush()

        if team_ids:
            for team_id in team_ids:
                db.add(
                    ChallengeTeam(
                        challenge_id=db_challenge.id,
                        team_id=team_id,
                    )
                )

        db.commit()
        db.refresh(db_challenge)
        return db_challenge

    except OperationalError as e:
        db.rollback()
        msg = str(e.orig).lower() if getattr(e, "orig", None) else str(e).lower()

        if "ein teammitglied ist bereits in einer anderen challenge in diesem zeitraum" in msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A team member is already participating in another challenge during this time period."
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Challenge could not be created."
        )


def update_challenge(db: Session, challenge_id: int, challenge_data: ChallengeUpdate) -> Optional[ChallengeModel]:
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

    try:
        update_data = challenge_data.model_dump(exclude_unset=True)
        team_ids = update_data.pop("team_ids", None)

        for key, value in update_data.items():
            setattr(challenge_obj, key, value)

        if challenge_data.is_deleted is not None:
            challenge_obj.is_deleted = challenge_data.is_deleted

        if team_ids is not None:
            db.query(ChallengeTeam).filter(
                ChallengeTeam.challenge_id == challenge_id
            ).delete()

            for team_id in team_ids:
                db.add(
                    ChallengeTeam(
                        challenge_id=challenge_id,
                        team_id=team_id,
                    )
                )

        db.commit()
        db.refresh(challenge_obj)
        return challenge_obj

    except OperationalError as e:
        db.rollback()
        msg = str(e.orig).lower() if getattr(e, "orig", None) else str(e).lower()

        if "ein teammitglied ist bereits in einer anderen challenge in diesem zeitraum" in msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A team member is already participating in another challenge during this time period."
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Challenge could not be updated."
        )


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


def get_finished_challenges_for_user(db: Session, user_id: int):
    return (
        db.query(ChallengeModel)
        .join(ChallengeTeam, ChallengeTeam.challenge_id == ChallengeModel.id)
        .join(TeamMember, TeamMember.team_id == ChallengeTeam.team_id)
        .filter(
            TeamMember.user_id == user_id,
            ChallengeModel.computed_state == "closed",
            ChallengeModel.is_deleted == False,
        )
        .order_by(ChallengeModel.end_date.desc())
        .all()
    )