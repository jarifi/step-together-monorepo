# app/api/v1/endpoints/challenges_endpoint.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schema.challenge import (
    ChallengeCreate,
    ChallengeInviteCreate,
    ChallengeInviteResponse,
    ChallengeJoinRequest,
    ChallengeJoinResponse,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.schema.team import ChallengeTeamWithSteps
from app.crud import challenge as challenge_crud
from app.core.security import get_current_user
from app.models.user import User

from app.logfile import challenge_logger

router = APIRouter(tags=["challenges"])


@router.post("/", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge_data = challenge.model_copy(update={"creator_id": current_user.id})

    try:
        result = challenge_crud.create_challenge(db, challenge_data)

        challenge_logger.info(
            f"CHALLENGE CREATED | challenge_id={result.id} | created_by={current_user.id}"
        )

        return result

    except HTTPException as e:
        challenge_logger.warning(
            f"CHALLENGE CREATE FAILED | user_id={current_user.id} | reason={e.detail}"
        )
        raise e

    except Exception as e:
        challenge_logger.error(
            f"CHALLENGE CREATE ERROR | user_id={current_user.id} | error={str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Challenge could not be created."
        )

@router.get("/", response_model=List[ChallengeResponse])
def read_all_challenges(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return challenge_crud.get_all_challenges(db, skip=skip, limit=limit)


# ✅ MUST be before /{challenge_id}
@router.get("/me/history", response_model=List[ChallengeResponse])
def read_my_finished_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return challenge_crud.get_finished_challenges_for_user(
        db, current_user.id
    )


@router.get("/{challenge_id}", response_model=ChallengeResponse)
def read_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = challenge_crud.get_challenge(db, challenge_id)
    if not challenge:
        challenge_logger.info(
            f"CHALLENGE READ | challenge_id={challenge_id} | requested_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: int,
    challenge_data: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    challenge_logger.info(
        f"CHALLENGE UPDATE ATTEMPT | challenge_id={challenge_id} | user_id={current_user.id} | changes={challenge_data.model_dump(exclude_unset=True)}"
    )

    updated_challenge = challenge_crud.update_challenge(
        db, challenge_id, challenge_data
    )

    if not updated_challenge:
        challenge_logger.warning(
            f"CHALLENGE UPDATE FAILED | challenge_id={challenge_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge_logger.info(
        f"CHALLENGE UPDATED | challenge_id={challenge_id} | updated_by={current_user.id}"
    )

    return updated_challenge


@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = challenge_crud.delete_challenge(db, challenge_id)
    if not success:
        challenge_logger.warning(
            f"CHALLENGE DELETE FAILED | challenge_id={challenge_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge_logger.info(
        f"CHALLENGE DELETED | challenge_id={challenge_id} | deleted_by={current_user.id}"
    )

    return None


@router.get("/{challenge_id}/teams", response_model=List[ChallengeTeamWithSteps])
def read_challenge_teams(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    teams = challenge_crud.get_teams_for_challenge(db, challenge_id)
    if teams is None:
        challenge_logger.warning(
            f"CHALLENGE TEAMS READ FAILED | challenge_id={challenge_id} | requested_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="Challenge not found")
    return teams


@router.post("/{challenge_id}/join", response_model=ChallengeJoinResponse)
def join_challenge(
    challenge_id: int,
    payload: ChallengeJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    joined = challenge_crud.join_challenge(
        db=db,
        challenge_id=challenge_id,
        user_id=current_user.id,
        team_id=payload.team_id,
    )

    challenge_logger.info(
        f"CHALLENGE JOINED | challenge_id={challenge_id} | user_id={current_user.id} | mode={joined['mode']}"
    )

    return joined


@router.post("/{challenge_id}/invites", response_model=ChallengeInviteResponse)
def create_challenge_invite(
    challenge_id: int,
    payload: ChallengeInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = challenge_crud.create_challenge_invite(
        db=db,
        challenge_id=challenge_id,
        inviter_user_id=current_user.id,
        invitee_user_id=payload.invitee_user_id,
        expires_at=payload.expires_at,
    )

    challenge_logger.info(
        f"CHALLENGE INVITE CREATED | challenge_id={challenge_id} | inviter_id={current_user.id} | invitee_id={payload.invitee_user_id} | invite_id={invite.id}"
    )

    return invite


@router.post("/{challenge_id}/invites/{invite_id}/accept", response_model=ChallengeInviteResponse)
def accept_challenge_invite(
    challenge_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = challenge_crud.respond_to_challenge_invite(
        db=db,
        invite_id=invite_id,
        user_id=current_user.id,
        accept=True,
    )

    if invite.challenge_id != challenge_id:
        raise HTTPException(status_code=404, detail="Invite not found for this challenge")

    challenge_logger.info(
        f"CHALLENGE INVITE ACCEPTED | challenge_id={challenge_id} | invite_id={invite_id} | user_id={current_user.id}"
    )

    return invite


@router.post("/{challenge_id}/invites/{invite_id}/decline", response_model=ChallengeInviteResponse)
def decline_challenge_invite(
    challenge_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = challenge_crud.respond_to_challenge_invite(
        db=db,
        invite_id=invite_id,
        user_id=current_user.id,
        accept=False,
    )

    if invite.challenge_id != challenge_id:
        raise HTTPException(status_code=404, detail="Invite not found for this challenge")

    challenge_logger.info(
        f"CHALLENGE INVITE DECLINED | challenge_id={challenge_id} | invite_id={invite_id} | user_id={current_user.id}"
    )

    return invite
