import pytest
from datetime import datetime, timedelta
from app.models.user import User
from app.models.challenge import Challenge
from app.models.challenge_participant import ChallengeParticipant
from app.models.challenge_team import ChallengeTeam
from app.models.team import Team
from app.models.team_member import TeamMember
from app.core.security import get_password_hash

@pytest.fixture
def test_user(db_session):
    user = User(
        name="Alice",
        email="alice1@example.com",
        hashed_password=get_password_hash("StrongPassword123"),
        step_length=0.75,
        privacy_policy_accepted = True,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    db_session.expunge(user)
    return user

@pytest.fixture
def test_team(db_session, test_user):
    team = Team(
        name="Test Team",
        creator_id=test_user.id,
        is_deleted=False,
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    db_session.expunge(team)
    return team


@pytest.fixture
def test_challenge(db_session, test_user, test_team):
    challenge = Challenge(
        name="Test Challenge",
        start_location="Start",
        target_location="End",
        distance=100.0,
        start_date=datetime.now() - timedelta(days=1),
        end_date=datetime.now() + timedelta(days=7),
        creator_id=test_user.id,
        team_id=test_team.id,
        mode=Challenge.MODE_TEAM,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db_session.add(challenge)
    db_session.flush()
    db_session.add(ChallengeTeam(challenge_id=challenge.id, team_id=test_team.id))
    db_session.add(TeamMember(user_id=test_user.id, team_id=test_team.id))
    db_session.commit()
    db_session.refresh(challenge)
    db_session.expunge(challenge)
    return challenge


@pytest.fixture
def individual_challenge(db_session, test_user):
    challenge = Challenge(
        name="Solo Challenge",
        start_location="Start",
        target_location="End",
        distance=50.0,
        start_date=datetime.now() - timedelta(days=1),
        end_date=datetime.now() + timedelta(days=7),
        creator_id=test_user.id,
        team_id=None,
        mode=Challenge.MODE_INDIVIDUAL,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db_session.add(challenge)
    db_session.flush()
    db_session.add(
        ChallengeParticipant(
            challenge_id=challenge.id,
            user_id=test_user.id,
            status=ChallengeParticipant.STATUS_ACTIVE,
        )
    )
    db_session.commit()
    db_session.refresh(challenge)
    db_session.expunge(challenge)
    return challenge


def login_headers(client, user_email: str):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "StrongPassword123", "privacyPolicyAccepted": True}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}

# POST / CREATE
def test_create_step_log_success(client, db_session, test_user, test_challenge):
    headers = login_headers(client, test_user.email)

    payload = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }

    response = client.post(
        f"/api/v1/step_logs/",
        json=payload,
        headers=headers
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == test_user.id
    assert data["challengeId"] == test_challenge.id
    assert data["teamId"] == test_challenge.team_id
    assert data["numberOfSteps"] == payload["numberOfSteps"]


def test_create_individual_step_log_success(client, test_user, individual_challenge):
    headers = login_headers(client, test_user.email)

    payload = {
        "challengeId": individual_challenge.id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 4200
    }

    response = client.post(
        "/api/v1/step_logs/",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == test_user.id
    assert data["challengeId"] == individual_challenge.id
    assert data["teamId"] is None
    assert data["numberOfSteps"] == 4200


def test_create_individual_step_log_requires_join(client, db_session, test_user):
    challenge = Challenge(
        name="Unjoined Solo Challenge",
        start_location="Start",
        target_location="End",
        distance=20.0,
        start_date=datetime.now() - timedelta(days=1),
        end_date=datetime.now() + timedelta(days=7),
        creator_id=test_user.id,
        team_id=None,
        mode=Challenge.MODE_INDIVIDUAL,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db_session.add(challenge)
    db_session.commit()
    db_session.refresh(challenge)
    challenge_id = challenge.id

    headers = login_headers(client, test_user.email)
    payload = {
        "challengeId": challenge_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 2500
    }

    response = client.post("/api/v1/step_logs/", json=payload, headers=headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "Join the individual challenge before logging steps"

# GET / READ
def test_get_all_step_logs_success(client, db_session, test_user, test_challenge):
    headers = login_headers(client, test_user.email)

    payload1 = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }
    payload2 = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 9000
    }

    response1 = client.post(
        f"/api/v1/step_logs/",
        json=payload1,
        headers=headers
    )
    assert response1.status_code == 200

    response2 = client.post(
        f"/api/v1/step_logs/",
        json=payload2,
        headers=headers
    )
    assert response2.status_code == 200

    get_response = client.get(
        "/api/v1/step_logs/",
        headers=headers
    )

    print(f"GET /step_logs/ response status: {get_response.status_code}")
    print(f"GET /step_logs/ response body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert isinstance(data, list)
    assert any(sl["numberOfSteps"] == 7500 for sl in data)
    assert any(sl["numberOfSteps"] == 9000 for sl in data)
    assert all(sl["userId"] == test_user.id for sl in data)

# GET BY ID
def test_get_step_log_by_id_success(client, db_session, test_user, test_challenge):
    headers = login_headers(client, test_user.email)

    payload = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }

    create_response = client.post(f"/api/v1/step_logs/", json=payload, headers=headers)
    assert create_response.status_code == 200
    progress_data = create_response.json()
    step_log_id = progress_data["id"]

    get_response = client.get(f"/api/v1/step_logs/{step_log_id}", headers=headers)

    print(f"GET /step_logs/{step_log_id} status: {get_response.status_code}")
    print(f"GET /step_logs/{step_log_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert data["id"] == step_log_id
    assert data["userId"] == test_user.id
    assert data["challengeId"] == test_challenge.id

# PUT / UPDATE
def test_update_step_log_success(client, db_session, test_user, test_challenge):
    headers = login_headers(client, test_user.email)

    create_payload = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }
    create_response = client.post(
        f"/api/v1/step_logs/",
        json=create_payload,
        headers=headers
    )

    assert create_response.status_code == 200
    created_data = create_response.json()
    step_log_id = created_data["id"]

    update_payload = {
        "numberOfSteps": 9000
    }

    update_response = client.put(
        f"/api/v1/step_logs/{step_log_id}",
        json=update_payload,
        headers=headers
    )

    print(f"PUT /step_logs/{step_log_id} status: {update_response.status_code}")
    print(f"PUT /step_logs/{step_log_id} body: {update_response.json()}")

    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["id"] == step_log_id
    assert updated_data["numberOfSteps"] == update_payload["numberOfSteps"]

# DELETE
def test_delete_step_log_success(client, db_session, test_user, test_challenge):
    headers = login_headers(client, test_user.email)

    payload = {
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }

    create_response = client.post(
        f"/api/v1/step_logs/",
        json=payload,
        headers=headers
    )

    assert create_response.status_code == 200
    step_log_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/step_logs/{step_log_id}",
        headers=headers
    )

    print(f"DELETE /step_logs/{step_log_id} status: {delete_response.status_code}")
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/step_logs/{step_log_id}",
        headers=headers
    )

    assert get_response.status_code == 404