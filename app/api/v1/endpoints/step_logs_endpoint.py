# file: app/api/v1/endpoints/step_logs_endpoint.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.step_log import StepLogCreate, StepLogResponse, StepLogUpdate
from app.crud import step_log as step_log_crud
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["step_logs"])

@router.post("/", response_model=StepLogResponse, dependencies=[Depends(get_current_user)])
def create_step_log(
    step_log: StepLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("Step log POST")
    return step_log_crud.create_step_log(
        db=db,
        step_log_data=step_log,
        user_id=current_user.id
    )

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
        raise HTTPException(status_code=404, detail="Step Log not found")
    return step_log

@router.get("/user/{user_id}", response_model=List[StepLogResponse])
def read_step_logs_by_user_id(
    user_id: int = Path(..., title="The ID of the user to get step logs for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_logs = step_log_crud.get_step_logs_by_user_id(db, user_id)
    if not step_logs:
        raise HTTPException(
            status_code=404,
            detail=f"No step logs found for user with id {user_id}"
        )
    return step_logs

@router.put("/{step_log_id}", response_model=StepLogResponse)
def update_step_log(
    step_log_id: int,
    step_log_data: StepLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_log = step_log_crud.get_step_log(db, step_log_id)
    if not step_log:
        raise HTTPException(status_code=404, detail="Step Log not found")
    updated_step_log = step_log_crud.update_step_log(db, step_log_id, step_log_data)
    return updated_step_log

@router.delete("/{step_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step_log(
    step_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    step_log = step_log_crud.get_step_log(db, step_log_id)
    if not step_log:
        raise HTTPException(status_code=404, detail="Step Log not found")
    success = step_log_crud.delete_step_log(db, step_log_id)
    return {"deleted": True}