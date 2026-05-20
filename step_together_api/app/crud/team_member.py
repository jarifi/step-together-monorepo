from sqlalchemy.orm import Session
from app.models.team_member import TeamMember
from app.schema.team_member import TeamMemberCreate

def create_team_member(db: Session, team_id: int, user_id: int):
    new_member = TeamMember(user_id=user_id, team_id=team_id)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

def get_team_member(db: Session, member_id: int) -> TeamMember | None:
    return db.query(TeamMember).filter(TeamMember.id == member_id).first()

def get_team_members_by_team_id(db: Session, team_id: int):
    return db.query(TeamMember).filter(TeamMember.team_id == team_id).all()

def get_all_team_members(db: Session) -> list[TeamMember]:
    return db.query(TeamMember).all()

def delete_team_member(db: Session, member_id: int) -> bool:
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        return False
    db.delete(member)
    db.commit()
    return True
