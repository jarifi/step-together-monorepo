# file: app/api/v1/endpoints/step_logs_endpoint.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
from datetime import date
import logging

from app.db.session import get_db
from app.schema.step_log import StepLogCreate, StepLogResponse, StepLogUpdate, StepWeekResponse
from app.crud import step_log as step_log_crud
from app.core.security import get_current_user
from app.models.user import User

from app.logfile import step_logger

router = APIRouter(tags=["step_logs"])

@router.post("/", response_model=StepLogResponse, dependencies=[Depends(get_current_user)])
def create_step_log(
    step_log: StepLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = step_log_crud.create_step_log(
        db=db,
        step_log_data=step_log,
        user_id=current_user.id
    )

    step_logger.info(
         f"STEP_LOG CREATED | user_id={current_user.id} | step_log_id={result.id} | date={step_log.date}"
    )

    return result

@router.get("/", response_model=List[StepLogResponse])
def read_all_step_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return step_log_crud.get_all_step_logs(db)

@router.get("/{step_log_id}", response_model=StepLogResponse)
def read_step_log(
    step_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_log = step_log_crud.get_step_log(db, step_log_id)
    if not step_log:
        step_logger.warning(
            f"STEP_LOG READ FAILED | step_log_id={step_log_id} | requested_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Step Log not found")

    return step_log

@router.get("/user/{user_id}", response_model=List[StepLogResponse])
def read_step_logs_by_user_id(
    user_id: int = Path(..., title="The ID of the user to get step logs for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_logs = step_log_crud.get_step_logs_by_user_id(db, user_id)
    return step_logs or []

# Admin Update
@router.put("/{step_log_id}", response_model=StepLogResponse)
def update_step_log(
    step_log_id: int,
    step_log_data: StepLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_log = step_log_crud.get_step_log(db, step_log_id)
    if not step_log:
        step_logger.warning(
            f"STEP_LOG UPDATE FAILED | step_log_id={step_log_id} | user_id={current_user.id} | reason=not_found"
        )
        raise HTTPException(status_code=404, detail="Step Log not found")
    
    # Non-admins may only update their own step logs
    if getattr(current_user, "role", "user") != 'admin' and step_log.user_id != current_user.id:
        step_logger.warning(
            f"STEP_LOG UPDATE FORBIDDEN | step_log_id={step_log_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=403, detail="Not authorized to update this step log")
    
    step_logger.info(
        f"STEP_LOG UPDATE ATTEMPT | step_log_id={step_log_id} | user_id={current_user.id} | role={current_user.role} | changes={step_log_data.model_dump(exclude_unset=True)}"
    )

    # Admins can update any record; users restricted by user_id
    if getattr(current_user, "role", "user") == 'admin':
        updated_step_log = step_log_crud.update_step_log(db, step_log_id, step_log_data)
    else:
        updated_step_log = step_log_crud.update_step_log(db, step_log_id, step_log_data, user_id=current_user.id)

    step_logger.info(
        f"STEP_LOG UPDATED | step_log_id={updated_step_log.id} | updated_by={current_user.id}"
    )

    return updated_step_log

# Removed duplicate PUT "/" endpoint to prevent 307 redirects and route ambiguity

@router.delete("/{step_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step_log(
    step_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_log = step_log_crud.get_step_log(db, step_log_id)
    if not step_log:
        step_logger.warning(
            f"STEP_LOG DELETE FAILED | step_log_id={step_log_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Step Log not found")

    step_log_crud.delete_step_log(db, step_log_id)

    step_logger.info(
        f"STEP_LOG DELETED | step_log_id={step_log_id} | deleted_by={current_user.id}"
    )
    return {"deleted": True}

@router.get("/challenge/{challenge_id}/user/{user_id}", response_model=List[StepWeekResponse])
def read_step_logs_by_user_and_date_range(
    challenge_id: int,
    user_id: int,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        step_logger.warning(
            f"STEP_LOG READ DENIED | requested_user={user_id} | by_user={current_user.id} | challenge_id={challenge_id}"
        )
        raise HTTPException(status_code=403, detail="Not authorized to view this user's steps")
        
    return step_log_crud.get_step_logs_by_user_and_date_range(
        db=db,
        user_id=user_id,
        challenge_id=challenge_id,
        start_date=from_date,
        end_date=to_date
    )