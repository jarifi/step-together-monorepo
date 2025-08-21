from sqlalchemy.orm import Session
from app.models.team import Team
from typing import List
from app.schema.team import TeamCreate, TeamUpdate

from app.models.team_member import TeamMember

def get_team(db: Session, team_id: int) -> Team | None:
    return db.query(Team).filter(Team.id == team_id).first()

def get_all_teams(db: Session, skip: int = 0, limit: int = 10) -> List[Team]:
    """
    Retrieve users with pagination.
    :param db: SQLAlchemy Session
    :param skip: Number of records to skip
    :param limit: Number of records to return
    """
    return db.query(Team).offset(skip).limit(limit).all()

def get_team_by_user_id(db: Session, user_id: int) -> Team | None:
    team_member = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    if team_member:
        return db.query(Team).filter(Team.id == team_member.team_id).first()
    return None

def create_team(db: Session, team_create: TeamCreate, creator_id: int) -> Team:
    db_team = Team(
        name=team_create.name,
        creator_id=creator_id
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

def update_team(db: Session, team_id: int, team_update: TeamUpdate) -> Team | None:
    db_team = get_team(db, team_id)
    if not db_team:
        return None
    if team_update.name is not None:
        db_team.name = team_update.name
    db.commit()
    db.refresh(db_team)
    return db_team

def delete_team(db: Session, team_id: int) -> bool:
    db_team = get_team(db, team_id)
    if not db_team:
        return False
    db.delete(db_team)
    db.commit()
    return True
