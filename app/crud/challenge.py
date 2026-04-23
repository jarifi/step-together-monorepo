# app/crud/challenge.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.challenge import Challenge as ChallengeModel
from app.schema.challenge import ChallengeCreate, ChallengeUpdate
from app.models.challenge_team import ChallengeTeam
from app.models.challenge_participant import ChallengeParticipant
from app.models.challenge_invite import ChallengeInvite
from app.models.team import Team
from app.models.step_log import StepLog
from app.models.team_member import TeamMember
from app.models.user import User as UserModel

from app.schema.team import TeamSchema, ChallengeTeamWithSteps


def get_all_challenges(db: Session, skip: int = 0, limit: int = 10) -> List[ChallengeModel]:
    return (
        db.query(ChallengeModel)
        .filter(ChallengeModel.is_deleted == False)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_challenge(db: Session, challenge_id: int) -> Optional[ChallengeModel]:
    return (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )


def get_active_challenge(db: Session, team_id: int):
    now = datetime.now(timezone.utc)
    return (
        db.query(ChallengeModel)
        .outerjoin(ChallengeTeam, ChallengeModel.id == ChallengeTeam.challenge_id)
        .filter(
            or_(ChallengeTeam.team_id == team_id, ChallengeModel.team_id == team_id),
            ChallengeModel.is_deleted == False,
            ChallengeModel.start_date <= now,
            ChallengeModel.end_date >= now,
        )
        .first()
    )


def create_challenge(db: Session, challenge_data: ChallengeCreate) -> ChallengeModel:
    data = challenge_data.model_dump(exclude={"team_ids"})
    team_ids = challenge_data.team_ids or []

    if data.get("mode") == ChallengeModel.MODE_INDIVIDUAL and team_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Individual challenges cannot be assigned to teams.",
        )

    db_challenge = ChallengeModel(**data)
    db.add(db_challenge)
    db.flush()

    if db_challenge.mode == ChallengeModel.MODE_INDIVIDUAL:
        db.add(
            ChallengeParticipant(
                challenge_id=db_challenge.id,
                user_id=db_challenge.creator_id,
                status=ChallengeParticipant.STATUS_ACTIVE,
            )
        )
        db.add(
            ChallengeInvite(
                challenge_id=db_challenge.id,
                inviter_user_id=db_challenge.creator_id,
                invitee_user_id=db_challenge.creator_id,
                status=ChallengeInvite.STATUS_ACCEPTED,
            )
        )

    if team_ids:
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

        if len(teams) != len(set(team_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more teams not found."
            )

        db.add_all([
            ChallengeTeam(challenge_id=db_challenge.id, team_id=team_id)
            for team_id in set(team_ids)
        ])

    db.commit()
    db.refresh(db_challenge)
    return db_challenge


def update_challenge(db: Session, challenge_id: int, challenge_data: ChallengeUpdate) -> Optional[ChallengeModel]:
    challenge_obj = db.query(ChallengeModel).filter(ChallengeModel.id == challenge_id).first()
    if not challenge_obj:
        return None

    update_data = challenge_data.model_dump(exclude_unset=True)
    team_ids = update_data.pop("team_ids", None)

    new_mode = update_data.get("mode", challenge_obj.mode)
    if new_mode == ChallengeModel.MODE_INDIVIDUAL and team_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Individual challenges cannot be assigned to teams.",
        )

    for key, value in update_data.items():
        setattr(challenge_obj, key, value)

    if challenge_data.is_deleted is not None:
        challenge_obj.is_deleted = challenge_data.is_deleted

    if team_ids is not None:
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

        if len(teams) != len(set(team_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more teams not found."
            )

        db.query(ChallengeTeam).filter(
            ChallengeTeam.challenge_id == challenge_id
        ).delete()

        if team_ids:
            db.add_all([
                ChallengeTeam(challenge_id=challenge_id, team_id=team_id)
                for team_id in set(team_ids)
            ])
    elif new_mode == ChallengeModel.MODE_INDIVIDUAL:
        db.query(ChallengeTeam).filter(
            ChallengeTeam.challenge_id == challenge_id
        ).delete()

    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj


def delete_challenge(db: Session, challenge_id: int) -> Optional[ChallengeModel]:
    challenge_obj = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge_obj:
        return None

    challenge_obj.is_deleted = True
    db.commit()
    db.refresh(challenge_obj)
    return challenge_obj


def get_participants_for_challenge(db: Session, challenge_id: int):
    """Return all active participants of an individual challenge with their total steps,
    sorted descending by total_steps (leaderboard order)."""
    from app.models.user import User as UserModel
    from app.schema.challenge import ChallengeParticipantWithSteps

    challenge = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge:
        return None

    if challenge.mode != ChallengeModel.MODE_INDIVIDUAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for individual challenges. Use /teams for team challenges.",
        )

    rows = (
        db.query(
            UserModel.id.label("user_id"),
            UserModel.name.label("name"),
            func.coalesce(func.sum(StepLog.number_of_steps), 0).label("total_steps"),
        )
        .join(ChallengeParticipant, ChallengeParticipant.user_id == UserModel.id)
        .outerjoin(
            StepLog,
            and_(
                StepLog.user_id == UserModel.id,
                StepLog.challenge_id == challenge_id,
            ),
        )
        .filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.status == ChallengeParticipant.STATUS_ACTIVE,
        )
        .group_by(UserModel.id, UserModel.name)
        .order_by(func.sum(StepLog.number_of_steps).desc())
        .all()
    )

    return [
        ChallengeParticipantWithSteps(
            user_id=row.user_id,
            name=row.name,
            total_steps=row.total_steps,
        )
        for row in rows
    ]


def get_teams_for_challenge(
    db: Session, challenge_id: int
) -> Optional[List[ChallengeTeamWithSteps]]:
    challenge = (
        db.query(ChallengeModel)
        .filter(
            ChallengeModel.id == challenge_id,
            ChallengeModel.is_deleted == False,
        )
        .first()
    )
    if not challenge:
        return None

    results = (
        db.query(
            Team.id.label("id"),
            Team.name.label("name"),
            func.coalesce(func.sum(StepLog.number_of_steps), 0).label("total_steps"),
        )
        .join(ChallengeTeam, ChallengeTeam.team_id == Team.id)
        .outerjoin(
            StepLog,
            and_(
                StepLog.team_id == Team.id,
                StepLog.challenge_id == challenge_id,
            ),
        )
        .filter(ChallengeTeam.challenge_id == challenge_id)
        .group_by(Team.id, Team.name)
        .all()
    )

    return [
        ChallengeTeamWithSteps(
            id=row.id,
            name=row.name,
            total_steps=row.total_steps,
        )
        for row in results
    ]


def get_active_challenges_for_user(db: Session, user_id: int) -> List[ChallengeModel]:
    """Return all non-deleted, non-closed challenges the user participates in
    (individual via ChallengeParticipant, team via TeamMember → ChallengeTeam)."""
    now = datetime.now(timezone.utc)

    individual_qs = (
        db.query(ChallengeModel)
        .join(ChallengeParticipant, ChallengeParticipant.challenge_id == ChallengeModel.id)
        .filter(
            ChallengeParticipant.user_id == user_id,
            ChallengeParticipant.status == ChallengeParticipant.STATUS_ACTIVE,
            ChallengeModel.is_deleted == False,
            ChallengeModel.end_date >= now,
        )
    )

    team_qs = (
        db.query(ChallengeModel)
        .join(ChallengeTeam, ChallengeTeam.challenge_id == ChallengeModel.id)
        .join(TeamMember, TeamMember.team_id == ChallengeTeam.team_id)
        .filter(
            TeamMember.user_id == user_id,
            ChallengeModel.is_deleted == False,
            ChallengeModel.end_date >= now,
        )
    )

    seen_ids: set[int] = set()
    results: List[ChallengeModel] = []
    for challenge in individual_qs.all() + team_qs.all():
        if challenge.id not in seen_ids and challenge.computed_state == "open":
            seen_ids.add(challenge.id)
            results.append(challenge)

    return results


def get_finished_challenges_for_user(db: Session, user_id: int):
    return (
        db.query(ChallengeModel)
        .join(ChallengeTeam, ChallengeTeam.challenge_id == ChallengeModel.id)
        .join(TeamMember, TeamMember.team_id == ChallengeTeam.team_id)
        .filter(
            TeamMember.user_id == user_id,
            ChallengeModel.computed_state == "closed",
            ChallengeModel.is_deleted == False,
        )
        .order_by(ChallengeModel.end_date.desc())
        .all()
    )


def join_challenge(
    db: Session,
    challenge_id: int,
    user_id: int,
    team_id: Optional[int] = None,
):
    challenge = get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.computed_state == "closed":
        raise HTTPException(status_code=400, detail="Closed challenges cannot be joined")

    if challenge.mode == ChallengeModel.MODE_TEAM:
        if team_id is None:
            team_id = (
                db.query(TeamMember.team_id)
                .join(ChallengeTeam, ChallengeTeam.team_id == TeamMember.team_id)
                .filter(
                    TeamMember.user_id == user_id,
                    ChallengeTeam.challenge_id == challenge_id,
                )
                .scalar()
            )

        if team_id is None:
            raise HTTPException(
                status_code=400,
                detail="team_id is required for team challenges",
            )

        team_is_linked = (
            db.query(ChallengeTeam)
            .filter(
                ChallengeTeam.challenge_id == challenge_id,
                ChallengeTeam.team_id == team_id,
            )
            .first()
        )
        if not team_is_linked:
            raise HTTPException(
                status_code=400,
                detail="Team is not part of this challenge",
            )

        existing_member = (
            db.query(TeamMember)
            .filter(TeamMember.user_id == user_id, TeamMember.team_id == team_id)
            .first()
        )

        if not existing_member:
            try:
                db.add(TeamMember(user_id=user_id, team_id=team_id))
                db.commit()
            except IntegrityError:
                db.rollback()
                # If another request inserted in parallel, this remains idempotent.

        return {
            "challenge_id": challenge_id,
            "user_id": user_id,
            "mode": ChallengeModel.MODE_TEAM,
            "registration": "team",
            "team_id": team_id,
        }

    participant = (
        db.query(ChallengeParticipant)
        .filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == user_id,
        )
        .first()
    )

    if not participant:
        participant = ChallengeParticipant(challenge_id=challenge_id, user_id=user_id)
        db.add(participant)
        db.commit()

    return {
        "challenge_id": challenge_id,
        "user_id": user_id,
        "mode": ChallengeModel.MODE_INDIVIDUAL,
        "registration": "individual",
        "team_id": None,
    }


def get_challenge_invites(
    db: Session,
    challenge_id: int,
    requester_user_id: int,
    status: Optional[str] = None,
):
    challenge = get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.creator_id != requester_user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the challenge creator can view invites",
        )

    query = db.query(ChallengeInvite).filter(ChallengeInvite.challenge_id == challenge_id)
    if status:
        query = query.filter(ChallengeInvite.status == status)
    return query.all()


def create_challenge_invite(
    db: Session,
    challenge_id: int,
    inviter_user_id: int,
    invitee_user_id: int,
    expires_at: Optional[datetime] = None,
):
    challenge = get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.mode != ChallengeModel.MODE_INDIVIDUAL:
        raise HTTPException(
            status_code=400,
            detail="Invites are only supported for individual challenges",
        )

    if challenge.creator_id != inviter_user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the challenge creator can send invites",
        )

    if inviter_user_id == invitee_user_id:
        raise HTTPException(status_code=400, detail="You cannot invite yourself")

    invitee_is_participant = (
        db.query(ChallengeParticipant)
        .filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == invitee_user_id,
        )
        .first()
    )
    if invitee_is_participant:
        raise HTTPException(status_code=400, detail="User already joined this challenge")

    existing_pending_invite = (
        db.query(ChallengeInvite)
        .filter(
            ChallengeInvite.challenge_id == challenge_id,
            ChallengeInvite.invitee_user_id == invitee_user_id,
            ChallengeInvite.status == ChallengeInvite.STATUS_PENDING,
        )
        .first()
    )
    if existing_pending_invite:
        return existing_pending_invite

    invite = ChallengeInvite(
        challenge_id=challenge_id,
        inviter_user_id=inviter_user_id,
        invitee_user_id=invitee_user_id,
        expires_at=expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def create_challenge_invites(
    db: Session,
    challenge_id: int,
    inviter_user_id: int,
    invitee_user_ids: List[int],
    expires_at: Optional[datetime] = None,
):
    """Create invites for many users and return per-user outcomes."""
    challenge = get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.mode != ChallengeModel.MODE_INDIVIDUAL:
        raise HTTPException(
            status_code=400,
            detail="Invites are only supported for individual challenges",
        )

    if challenge.creator_id != inviter_user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the challenge creator can send invites",
        )

    # Preserve input order while avoiding duplicated processing.
    unique_user_ids: List[int] = []
    seen_user_ids: set[int] = set()
    for user_id in invitee_user_ids:
        if user_id not in seen_user_ids:
            seen_user_ids.add(user_id)
            unique_user_ids.append(user_id)

    existing_user_ids = {
        row[0]
        for row in db.query(UserModel.id)
        .filter(UserModel.id.in_(unique_user_ids))
        .all()
    }

    existing_participants = {
        row[0]
        for row in db.query(ChallengeParticipant.user_id)
        .filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id.in_(unique_user_ids),
        )
        .all()
    }

    pending_invites = (
        db.query(ChallengeInvite)
        .filter(
            ChallengeInvite.challenge_id == challenge_id,
            ChallengeInvite.invitee_user_id.in_(unique_user_ids),
            ChallengeInvite.status == ChallengeInvite.STATUS_PENDING,
        )
        .all()
    )
    pending_by_user_id = {invite.invitee_user_id: invite for invite in pending_invites}

    created_invites: List[ChallengeInvite] = []
    already_pending: List[ChallengeInvite] = []
    already_participant: List[int] = []
    invalid_users: List[int] = []
    skipped_self: List[int] = []
    errors = []

    for user_id in unique_user_ids:
        if user_id == inviter_user_id:
            skipped_self.append(user_id)
            continue

        if user_id not in existing_user_ids:
            invalid_users.append(user_id)
            continue

        if user_id in existing_participants:
            already_participant.append(user_id)
            continue

        pending = pending_by_user_id.get(user_id)
        if pending is not None:
            already_pending.append(pending)
            continue

        created_invites.append(
            ChallengeInvite(
                challenge_id=challenge_id,
                inviter_user_id=inviter_user_id,
                invitee_user_id=user_id,
                expires_at=expires_at,
            )
        )

    if created_invites:
        try:
            db.add_all(created_invites)
            db.commit()
            for invite in created_invites:
                db.refresh(invite)
        except IntegrityError:
            db.rollback()
            for invite in created_invites:
                errors.append(
                    {
                        "user_id": invite.invitee_user_id,
                        "reason": "could_not_create_invite",
                    }
                )
            created_invites = []

    return {
        "challenge_id": challenge_id,
        "created": created_invites,
        "already_pending": already_pending,
        "already_participant": already_participant,
        "invalid_users": invalid_users,
        "skipped_self": skipped_self,
        "errors": errors,
    }


def respond_to_challenge_invite(
    db: Session,
    invite_id: int,
    user_id: int,
    accept: bool,
):
    invite = db.query(ChallengeInvite).filter(ChallengeInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.invitee_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to respond to this invite")

    if invite.status != ChallengeInvite.STATUS_PENDING:
        return invite

    if invite.expires_at:
        now_utc = datetime.now(timezone.utc)
        expires_at = invite.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now_utc > expires_at:
            invite.status = ChallengeInvite.STATUS_CANCELLED
            db.commit()
            db.refresh(invite)
            raise HTTPException(status_code=400, detail="Invite has expired")

    invite.status = (
        ChallengeInvite.STATUS_ACCEPTED if accept else ChallengeInvite.STATUS_DECLINED
    )

    if accept:
        participant = (
            db.query(ChallengeParticipant)
            .filter(
                ChallengeParticipant.challenge_id == invite.challenge_id,
                ChallengeParticipant.user_id == user_id,
            )
            .first()
        )
        if not participant:
            db.add(
                ChallengeParticipant(
                    challenge_id=invite.challenge_id,
                    user_id=user_id,
                )
            )

    db.commit()
    db.refresh(invite)
    return invite

def get_invites_for_user(db: Session, user_id: int):
    """
    Fetches all invites received by a specific user.
    """
    return (
        db.query(ChallengeInvite)
        .filter(ChallengeInvite.invitee_user_id == user_id)
        .all()
    )