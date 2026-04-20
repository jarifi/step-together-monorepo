from datetime import datetime, timedelta, timezone

from app.core.security import get_password_hash
from app.models.challenge import Challenge
from app.models.challenge_participant import ChallengeParticipant
from app.models.challenge_team import ChallengeTeam
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User


def _create_user(db_session, name: str, email: str, password: str = "StrongPassword123"):
    user = User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        privacy_policy_accepted=True,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, email: str, password: str = "StrongPassword123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def test_individual_challenge_invite_accept_flow(client, db_session):
    creator = _create_user(db_session, "Creator User", "creator@example.com")
    friend = _create_user(db_session, "Friend User", "friend@example.com")
    creator_id = creator.id
    creator_email = creator.email
    friend_id = friend.id
    friend_email = friend.email

    challenge = Challenge(
        name="Friends Sprint",
        start_location="Graz",
        target_location="Vienna",
        distance=100.0,
        start_date=datetime.now(timezone.utc) - timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=7),
        creator_id=creator_id,
        mode=Challenge.MODE_INDIVIDUAL,
    )
    db_session.add(challenge)
    db_session.commit()
    db_session.refresh(challenge)
    challenge_id = challenge.id

    creator_token = _login(client, creator_email)
    friend_token = _login(client, friend_email)

    join_response = client.post(
        f"/api/v1/challenges/{challenge_id}/join",
        json={},
        headers={"Authorization": f"Bearer {creator_token}"},
    )
    assert join_response.status_code == 200
    assert join_response.json()["mode"] == "individual"

    invite_response = client.post(
        f"/api/v1/challenges/{challenge_id}/invites",
        json={"inviteeUserId": friend_id},
        headers={"Authorization": f"Bearer {creator_token}"},
    )
    assert invite_response.status_code == 200
    invite_id = invite_response.json()["id"]
    assert invite_response.json()["status"] == "pending"

    accept_response = client.post(
        f"/api/v1/challenges/{challenge_id}/invites/{invite_id}/accept",
        headers={"Authorization": f"Bearer {friend_token}"},
    )
    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"

    participant = (
        db_session.query(ChallengeParticipant)
        .filter(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == friend_id,
        )
        .first()
    )
    assert participant is not None


def test_team_challenge_join_keeps_team_based_registration(client, db_session):
    creator = _create_user(db_session, "Team Creator", "teamcreator@example.com")
    member = _create_user(db_session, "Team Member", "teammember@example.com")
    creator_id = creator.id
    member_id = member.id
    member_email = member.email

    team = Team(name="Alpha Team", creator_id=creator_id)
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    team_id = team.id

    challenge = Challenge(
        name="Team Battle",
        start_location="Linz",
        target_location="Salzburg",
        distance=120.0,
        start_date=datetime.now(timezone.utc) - timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=10),
        creator_id=creator_id,
        mode=Challenge.MODE_TEAM,
    )
    db_session.add(challenge)
    db_session.commit()
    db_session.refresh(challenge)
    challenge_id = challenge.id

    db_session.add(ChallengeTeam(challenge_id=challenge_id, team_id=team_id))
    db_session.commit()

    member_token = _login(client, member_email)

    join_response = client.post(
        f"/api/v1/challenges/{challenge_id}/join",
        json={"teamId": team_id},
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert join_response.status_code == 200
    assert join_response.json()["mode"] == "team"
    assert join_response.json()["registration"] == "team"
    assert join_response.json()["teamId"] == team_id

    team_member = (
        db_session.query(TeamMember)
        .filter(TeamMember.user_id == member_id, TeamMember.team_id == team_id)
        .first()
    )
    assert team_member is not None
