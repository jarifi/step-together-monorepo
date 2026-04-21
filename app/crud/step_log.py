#file: app/crud/step_log.py
from sqlalchemy.orm import Session
from datetime import date
import calendar
from fastapi import HTTPException, status
from app.models.challenge import Challenge as ChallengeModel
from app.models.challenge_participant import ChallengeParticipant
from app.models.challenge_team import ChallengeTeam
from app.models.team_member import TeamMember
from app.models.step_log import StepLog
from app.schema.step_log import StepLogCreate, StepLogResponse, StepDashboardResponse, StepLogUpdate, StepWeekResponse # Corrected import: No StepLogSchema, use StepLogCreate for input
from datetime import datetime, timedelta
from sqlalchemy import func


def _validate_step_log_membership(
    db: Session,
    *,
    challenge_id: int,
    user_id: int,
    team_id: int | None,
) -> int | None:
    challenge = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.mode == ChallengeModel.MODE_INDIVIDUAL:
        if team_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="team_id must not be provided for individual challenges",
            )

        participant = (
            db.query(ChallengeParticipant)
            .filter(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.user_id == user_id,
                ChallengeParticipant.status == ChallengeParticipant.STATUS_ACTIVE,
            )
            .first()
        )
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Join the individual challenge before logging steps",
            )

        return None

    if team_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="team_id is required for team challenges",
        )

    team_is_linked = (
        db.query(ChallengeTeam)
        .filter(
            ChallengeTeam.challenge_id == challenge_id,
            ChallengeTeam.team_id == team_id,
        )
        .first()
    )
    if not team_is_linked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is not part of this challenge",
        )

    membership = (
        db.query(TeamMember)
        .filter(TeamMember.user_id == user_id, TeamMember.team_id == team_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to log steps for this team",
        )

    return team_id


def get_all_step_logs(db: Session):
    return db.query(StepLog).all()

def get_step_log(db: Session, step_log_id: int):
    return db.query(StepLog).filter(StepLog.id == step_log_id).first()

def create_step_log(db: Session, step_log_data: StepLogCreate, user_id: int): # Changed type hint from StepLogSchema to StepLogCreate
    validated_team_id = _validate_step_log_membership(
        db,
        challenge_id=step_log_data.challenge_id,
        user_id=user_id,
        team_id=step_log_data.team_id,
    )

    db_step_log = StepLog(
        user_id=user_id,
        challenge_id=step_log_data.challenge_id,
        team_id=validated_team_id,
        date=step_log_data.date,
        number_of_steps=step_log_data.number_of_steps,
    )
    db.add(db_step_log)
    db.commit()
    db.refresh(db_step_log)
    return db_step_log

def update_step_log(db: Session, step_log_id: int, step_log_data: StepLogUpdate, user_id: int | None = None,):
     # Changed type hint from StepLogSchema to StepLogCreate
    query = db.query(StepLog).filter(StepLog.id == step_log_id)

    if user_id is not None:
        query = query.filter(StepLog.user_id == user_id)

    step_log_obj = query.first()
    if not step_log_obj:
        return None

    update_data = step_log_data.model_dump(exclude_unset=True)
    target_challenge_id = update_data.get("challenge_id", step_log_obj.challenge_id)
    target_team_id = (
        update_data["team_id"]
        if "team_id" in update_data
        else step_log_obj.team_id if target_challenge_id == step_log_obj.challenge_id else None
    )

    effective_user_id = user_id if user_id is not None else step_log_obj.user_id
    validated_team_id = _validate_step_log_membership(
        db,
        challenge_id=target_challenge_id,
        user_id=effective_user_id,
        team_id=target_team_id,
    )

    update_data["team_id"] = validated_team_id
    
    for key, value in update_data.items():
        setattr(step_log_obj, key, value)

    db.commit()
    db.refresh(step_log_obj)
    return step_log_obj

def delete_step_log(db: Session, step_log_id: int):
    step_log_obj = db.query(StepLog).filter(StepLog.id == step_log_id).first()
    if not step_log_obj:
        return False
    db.delete(step_log_obj)
    db.commit()
    return True
def get_step_logs_by_user_id(db: Session, user_id: int):
    return db.query(StepLog).filter(StepLog.user_id == user_id).all()

def get_steps_for_current_week(db: Session, user_id: int, challenge_id: int):
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print("user_id:", user_id)
    print("challenge_id:", challenge_id)
    print("Today:", today)
    print("Start of week:", start_of_week.date())
    print("End of week:", end_of_week.date())

    step_data = (
        db.query(
            func.date(StepLog.date).label("date"),
            func.sum(StepLog.number_of_steps).label("number_of_steps")
        )
        .filter(
            StepLog.user_id == user_id,
            StepLog.challenge_id == challenge_id,
            func.date(StepLog.date) >= start_of_week.date(),
            func.date(StepLog.date) <= end_of_week.date()
        )
        .group_by(func.date(StepLog.date))
        .order_by(func.date(StepLog.date))
        .all()
    )
    return [
        StepDashboardResponse(
            date=row.date,
            day_of_week=calendar.day_name[row.date.weekday()],
            number_of_steps=row.number_of_steps
        )
        for row in step_data
    ]

def get_step_logs_by_user_and_date_range(db: Session, user_id: int, challenge_id: int, start_date: date, end_date: date):
    step_data = (
        db.query(
            func.date(StepLog.date).label("date"),
            func.sum(StepLog.number_of_steps).label("number_of_steps")
        )
        .filter(
            StepLog.user_id == user_id,
            StepLog.challenge_id == challenge_id,
            func.date(StepLog.date) >= start_date,
            func.date(StepLog.date) <= end_date
        )
        .group_by(func.date(StepLog.date))
        .order_by(func.date(StepLog.date))
        .all()
    )

    return [
        StepWeekResponse(
            date=row.date,
            day_of_week=calendar.day_name[row.date.weekday()],
            number_of_steps=row.number_of_steps,
            challenge_id=challenge_id,
            user_id=user_id
        )
        for row in step_data
    ]