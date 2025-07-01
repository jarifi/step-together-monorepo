from sqlalchemy.orm import Session
from app.models.schritt_log import SchrittLog
from app.schema import SchrittLogSchema

def get_all_schritt_logs(db: Session):
    return db.query(SchrittLog).all()

def get_schritt_log(db: Session, schritt_log_id: int):
    return db.query(SchrittLog).filter(SchrittLog.id == schritt_log_id).first()

def create_schritt_log(db: Session, schritt_log_data: SchrittLogSchema):
    db_schritt_log = SchrittLog(**schritt_log_data.model_dump())
    db.add(db_schritt_log)
    db.commit()
    db.refresh(db_schritt_log)
    return db_schritt_log

def update_schritt_log(db: Session, schritt_log_id: int, schritt_log_data: SchrittLogSchema):
    schritt_log_obj = db.query(SchrittLog).filter(SchrittLog.id == schritt_log_id).first()
    if not schritt_log_obj:
        return None
    for key, value in schritt_log_data.model_dump(exclude_unset=True).items():
        setattr(schritt_log_obj, key, value)
    db.commit()
    db.refresh(schritt_log_obj)
    return schritt_log_obj

def delete_schritt_log(db: Session, schritt_log_id: int):
    schritt_log_obj = db.query(SchrittLog).filter(SchrittLog.id == schritt_log_id).first()
    if not schritt_log_obj:
        return False
    db.delete(schritt_log_obj)
    db.commit()
    return True