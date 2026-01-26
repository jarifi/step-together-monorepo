# File: app/api/v1/endpoints/team_members.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.team_member import TeamMemberCreate, TeamMemberResponse
from app.crud import team_member as team_member_crud
from app.core.security import get_current_user
from app.models.user import User

from app.logfile import team_member_logger

router = APIRouter(tags=["team_members"])


@router.post("/", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def create_team_member(
    member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = team_member_crud.create_team_member(
        db=db,
        team_id=member.team_id,
        user_id=current_user.id
    )
    
    team_member_logger.info(
        f"TEAM_MEMBER CREATED | team_id={member.team_id} | user_id={current_user.id} | member_id={created.id}"
    )

    return created


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
        team_member_logger.warning(
            f"TEAM_MEMBER READ FAILED | member_id={member_id} | requested_by={current_user.id}"
        )
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
        team_member_logger.warning(
            f"TEAM_MEMBER DELETE FAILED | member_id={member_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Team member not found")
    
    team_member_logger.info(
        f"TEAM_MEMBER DELETED | member_id={member_id} | deleted_by={current_user.id}"
    )

    return {"deleted": True}
