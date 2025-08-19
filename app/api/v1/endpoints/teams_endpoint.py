from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import and_

from app.db.session import get_db
from app.schema.team import TeamCreate, TeamSchema, TeamUpdate
from app.schema.team_member import TeamMemberChallengeSteps
from app.crud import team as team_crud
from app.core.security import get_current_user
from app.models.user import User
from app.models.team import Team
from app.models.challenge_team import ChallengeTeam
from app.models.team_member import TeamMember
from app.models.step_log import StepLog

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

@router.get("/members/active_challenge/{team_id}/{challenge_id}", response_model=List[TeamMemberChallengeSteps])
def get_team_members_challenge_steps(
    team_id: int,
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge_team = (
        db.query(ChallengeTeam).filter(ChallengeTeam.team_id == team_id, ChallengeTeam.challenge_id == challenge_id,).first()
    )
    if not challenge_team:
        raise HTTPException(status_code=404, detail="This team is not part of the challange") 
    results = (
        db.query(
            User.id.label("id"),
            User.name.label("name"),
            func.coalesce(func.sum(StepLog.number_of_steps), 0).label("numberOfSteps"),
        )
        .join(TeamMember, TeamMember.user_id == User.id)
        .outerjoin(
            StepLog,
            and_(
                StepLog.user_id == User.id,
                StepLog.challenge_id == challenge_id
            )
        )
        .filter(TeamMember.team_id == team_id)
        .group_by(User.id, User.name)
        .all()
    )

    return results