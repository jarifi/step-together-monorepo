from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.team import TeamCreate, TeamSchema, TeamUpdate
from app.crud import team as team_crud
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(tags=["teams"])

@router.post("/", response_model=TeamSchema, status_code=status.HTTP_201_CREATED)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    return team_crud.create_team(db, team, creator_id=current_user.id)

@router.get("/", response_model=List[TeamSchema])
def read_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    return team_crud.get_all_teams(db)

@router.get("/{team_id}", response_model=TeamSchema)
def read_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    team = team_crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.put("/{team_id}", response_model=TeamSchema)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    team = team_crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this team")
    updated_team = team_crud.update_team(db, team_id, team_update)
    return updated_team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Auth required
):
    team = team_crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this team")
    success = team_crud.delete_team(db, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"deleted": True}
