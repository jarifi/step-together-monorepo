import pytest
from datetime import datetime, timedelta
from app.models.user import User
from app.models.challenge import Challenge
from app.models.step_log import StepLog
from app.core.security import get_password_hash

@pytest.fixture
def test_user(db_session):
    user = User(
        name="Alice",
        email="alice1@example.com",
        hashed_password=get_password_hash("StrongPassword123"),
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    db_session.expunge(user)
    return user

@pytest.fixture
def test_challenge(db_session, test_user):
    challenge = Challenge(
        name="Test Challenge",
        start_location="Start",
        target_location="End",
        distance=100.0,
        start_date=datetime.now(),
        end_date=datetime.now(),
        creator_id=test_user.id,
        team_id=1,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db_session.add(challenge)
    db_session.commit()
    db_session.refresh(challenge)
    db_session.expunge(challenge)
    return challenge

# POST / CREATE
def test_create_step_log_success(client, db_session, test_user, test_challenge):
    # Verify endpoint matches your actual route
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]

    payload = {
        "userId": test_user.id,
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }

    response = client.post(
        f"/api/v1/step_logs/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == test_user.id
    assert data["challengeId"] == test_challenge.id
    assert data["numberOfSteps"] == payload["numberOfSteps"]

# GET / READ
def test_get_all_step_logs_success(client, db_session, test_user, test_challenge):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]

    payload1 = {
        "userId": test_user.id,
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 7500
    }
    payload2 = {
        "userId": test_user.id,
        "challengeId": test_challenge.id,
        "teamId": test_challenge.team_id,
        "date": datetime.now().isoformat(),
        "numberOfSteps": 9000
    }

    response1 = client.post(
        f"/api/v1/step_logs/",
        json=payload1,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response1.status_code == 200

    response2 = client.post(
        f"/api/v1/step_logs/",
        json=payload2,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 200

    get_response = client.get(
        "/api/v1/step_logs/",
        headers={"Authorization": f"Bearer {token}"}    
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
    login_response = client.post("/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"})
    
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]

    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "userId": test_user.id,
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
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "userId": test_user.id,
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
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "userId": test_user.id,
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