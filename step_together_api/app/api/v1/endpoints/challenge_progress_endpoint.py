from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.challenge_progress import ChallengeProgressUpdate, ChallengeProgressResponse
from app.crud import challenge_progress as challenge_progress_crud
from app.core.security import get_current_user
from app.models.user import User

from app.logfile import challenge_progress_logger

router = APIRouter(tags=["challenge_progress"])

@router.post("/", response_model=ChallengeProgressResponse, status_code=status.HTTP_201_CREATED)
def create_progress(
    challenge_id: int,
    progress_data: ChallengeProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    
    created = challenge_progress_crud.create_challenge_progress(db, current_user.id, challenge_id, progress_data)
    
    challenge_progress_logger.info(
        f"CHALLENGE_PROGRESS CREATED | user_id={current_user.id} | challenge_id={challenge_id} | progress_id={created.id}"
    )   

    return created

@router.get("/", response_model=List[ChallengeProgressResponse])
def read_all_progresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    return challenge_progress_crud.get_all_challenge_progresses(db)

@router.get("/{progress_id}", response_model=ChallengeProgressResponse)
def read_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    progress = challenge_progress_crud.get_challenge_progress(db, progress_id)
    if not progress:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS READ FAILED | progress_id={progress_id} | requested_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge progress not found")
    # Optional: Add ownership check here
    if progress.user_id != current_user.id:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS READ FORBIDDEN | progress_id={progress_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this progress")
    return progress

@router.put("/{progress_id}", response_model=ChallengeProgressResponse)
def update_progress(
    progress_id: int,
    progress_data: ChallengeProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    progress = challenge_progress_crud.get_challenge_progress(db, progress_id)
    if not progress:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS UPDATE FAILED | progress_id={progress_id} | user_id={current_user.id} | reason=not_found"
        )
        raise HTTPException(status_code=404, detail="Challenge progress not found")
    if progress.user_id != current_user.id:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS UPDATE FORBIDDEN | progress_id={progress_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this progress")
    
    challenge_progress_logger.info(
        f"CHALLENGE_PROGRESS UPDATE ATTEMPT | progress_id={progress_id} | user_id={current_user.id} | changes={progress_data.model_dump(exclude_unset=True)}"
    )

    updated_progress = challenge_progress_crud.update_challenge_progress(db, progress_id, progress_data)

    challenge_progress_logger.info(
        f"CHALLENGE_PROGRESS UPDATED | progress_id={updated_progress.id} | user_id={current_user.id}"
    )

    return updated_progress

@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    progress = challenge_progress_crud.get_challenge_progress(db, progress_id)
    if not progress:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS DELETE FAILED | progress_id={progress_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge progress not found")
    if progress.user_id != current_user.id:
        challenge_progress_logger.warning(
            f"CHALLENGE_PROGRESS DELETE FORBIDDEN | progress_id={progress_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this progress")
    
    challenge_progress_crud.delete_challenge_progress(db, progress_id)

    challenge_progress_logger.info(
        f"CHALLENGE_PROGRESS DELETED | progress_id={progress_id} | deleted_by={current_user.id}"
    )
    
    return {"deleted": True}
