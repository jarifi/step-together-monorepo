from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.challenge import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.crud import challenge as challenge_crud
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["challenges"])

@router.post("/", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return challenge_crud.create_challenge(db, challenge)

@router.get("/", response_model=List[ChallengeResponse])
def read_all_challenges(
    skip: int = Query(0, ge=0, description="Number of recrods to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximus number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return challenge_crud.get_all_challenges(db, skip=skip, limit=limit)

@router.get("/{challenge_id}", response_model=ChallengeResponse)
def read_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    challenge = challenge_crud.get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: int,
    challenge_data: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_challenge = challenge_crud.update_challenge(db, challenge_id, challenge_data)
    if not updated_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return updated_challenge

@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = challenge_crud.delete_challenge(db, challenge_id)
    if not success:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"deleted": True}