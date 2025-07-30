from sqlalchemy.orm import Session
from app.models.step_log import StepLog
from app.schema import StepLogSchema

def get_all_step_logs(db: Session):
    return db.query(StepLog).all()

def get_step_log(db: Session, step_log_id: int):
    return db.query(StepLog).filter(StepLog.id == step_log_id).first()

def create_step_log(db: Session, step_log_data: StepLogSchema):
    db_step_log = StepLog(**step_log_data.model_dump())
    db.add(db_step_log)
    db.commit()
    db.refresh(db_step_log)
    return db_step_log

def update_step_log(db: Session, step_log_id: int, step_log_data: StepLogSchema):
    step_log_obj = db.query(StepLog).filter(StepLog.id == step_log_id).first()
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

# Add this function to your existing CRUD operations
def get_step_logs_by_user_id(db: Session, user_id: int):
    """Get all step logs for a specific user"""
    return db.query(StepLog).filter(StepLog.user_id == user_id).all()