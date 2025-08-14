#file: app/crud/step_log.py
from sqlalchemy.orm import Session
import calendar
from app.models.step_log import StepLog
from app.schema.step_log import StepLogCreate, StepLogResponse, StepDashboardResponse, StepLogUpdate # Corrected import: No StepLogSchema, use StepLogCreate for input
from datetime import datetime, timedelta
from sqlalchemy import func
def get_all_step_logs(db: Session):
    return db.query(StepLog).all()

def get_step_log(db: Session, step_log_id: int):
    return db.query(StepLog).filter(StepLog.id == step_log_id).first()

def create_step_log(db: Session, step_log_data: StepLogCreate, user_id: int): # Changed type hint from StepLogSchema to StepLogCreate
    db_step_log = StepLog(
        user_id=user_id,
        challenge_id=step_log_data.challenge_id,
        team_id=step_log_data.team_id,
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
    
    for key, value in step_log_data.model_dump(exclude_unset=True).items():
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