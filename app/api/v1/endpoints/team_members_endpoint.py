# File: app/api/v1/endpoints/team_members.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.team_member import TeamMemberCreate, TeamMemberResponse
from app.crud import team_member as team_member_crud
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["team_members"])


@router.post("/", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def create_team_member(
    member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return team_member_crud.create_team_member(db, member)


@router.get("/", response_model=List[TeamMemberResponse])
def read_all_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return team_member_crud.get_all_team_members(db)

@router.get("/team/{team_id}", response_model=List[TeamMemberResponse])
def read_team_members_by_team_id(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return team_member_crud.get_team_members_by_team_id(db, team_id)


@router.get("/{member_id}", response_model=TeamMemberResponse)
def read_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = team_member_crud.get_team_member(db, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = team_member_crud.delete_team_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"deleted": True}
