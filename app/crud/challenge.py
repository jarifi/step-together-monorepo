# app/crud/challenge.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate
from app.models.challenge_team import ChallengeTeam
from app.models.team import Team
from app.models.step_log import StepLog
from app.models.team_member import TeamMember

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
    data = challenge_data.model_dump(exclude={"team_ids"})
    team_ids = challenge_data.team_ids or []

    db_challenge = ChallengeModel(**data)
    db.add(db_challenge)
    db.flush()

    if team_ids:
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

        if len(teams) != len(set(team_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more teams not found."
            )

        db.add_all([
            ChallengeTeam(challenge_id=db_challenge.id, team_id=team_id)
            for team_id in set(team_ids)
        ])

    db.commit()
    db.refresh(db_challenge)
    return db_challenge


def update_challenge(db: Session, challenge_id: int, challenge_data: ChallengeUpdate) -> Optional[ChallengeModel]:
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()
    if not challenge_obj:
        return None

    update_data = challenge_data.model_dump(exclude_unset=True)
    team_ids = update_data.pop("team_ids", None)

    for key, value in update_data.items():
        setattr(challenge_obj, key, value)

    if challenge_data.is_deleted is not None:
        challenge_obj.is_deleted = challenge_data.is_deleted

    if team_ids is not None:
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

        if len(teams) != len(set(team_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more teams not found."
            )

        db.query(ChallengeTeam).filter(
            ChallengeTeam.challenge_id == challenge_id
        ).delete()

        if team_ids:
            db.add_all([
                ChallengeTeam(challenge_id=challenge_id, team_id=team_id)
                for team_id in set(team_ids)
            ])

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