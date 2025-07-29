import pytest
from datetime import datetime, timedelta
from app.models.challenge import Challenge
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def test_user(db_session):
    """Test user with all required fields"""
    user = User(
        name="Alice",
        email="alice1@example.com",
        hashed_password=get_password_hash("StrongPassword123"),
        is_active=True,  # CRITICAL
        is_verified=True  # CRITICAL
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
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
    return challenge

# POST / CREATE
def test_create_challenge_progress_success(client, db_session, test_user, test_challenge):
    # Verify endpoint matches your actual route
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice1@example.com", "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 12.5,
        "total_steps": 2500,
        "updated_at": datetime.now().isoformat(),
    }

    response = client.post(
        f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}",  # Make sure this matches your actual route
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == payload["user_id"]
    assert data["challenge_id"] == payload["challenge_id"]
    assert data["distance_covered"] == payload["distance_covered"]

# GET / READ
def test_get_all_challenge_progresses(client, db_session, test_user, test_challenge):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload1 = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 12.5,
        "total_steps": 2500,
        "updated_at": datetime.now().isoformat(),
    }
    payload2 = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 25.0,
        "total_steps": 5000,
        "updated_at": datetime.now().isoformat(),
    }

    response1 = client.post(
        f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}",
        json=payload1,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response1.status_code == 201

    response2 = client.post(
        f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}",
        json=payload2,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 201

    get_response = client.get(
        "/api/v1/challenge_progress/",
        headers={"Authorization": f"Bearer {token}"}    
    )

    print(f"GET /challenge_progress/ response status: {get_response.status_code}")
    print(f"GET /challenge_progress/ response body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert isinstance(data, list)
    assert any(cp["distance_covered"] == 12.5 for cp in data)
    assert any(cp["distance_covered"] == 25.0 for cp in data)
    assert any(cp["user_id"] == test_user.id for cp in data)

# GET BY ID
def test_get_challenge_progress_by_id(client, db_session, test_user, test_challenge):
    login_response = client.post("/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"})
    
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 12.5,
        "total_steps": 2500,
        "updated_at": datetime.now().isoformat(),
    }

    create_response = client.post(f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}", json=payload, headers=headers)
    assert create_response.status_code == 201
    progress_data = create_response.json()
    challenge_progress_id = progress_data["id"]

    get_response = client.get(f"/api/v1/challenge_progress/{challenge_progress_id}", headers=headers)

    print(f"GET /challenge_progress/{challenge_progress_id} status: {get_response.status_code}")
    print(f"GET /challenge_progress/{challenge_progress_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert data["id"] == challenge_progress_id
    assert data["user_id"] == test_user.id
    assert data["challenge_id"] == test_challenge.id
    assert data["distance_covered"] == 12.5
    assert data["total_steps"] == 2500

# PUT / UPDATE
def test_update_challenge_progress_success(client, db_session, test_user, test_challenge):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 10.0,
        "total_steps": 2000,
        "updated_at": datetime.now().isoformat(), 
    }
    create_response = client.post(
        f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}",
        json=create_payload,
        headers=headers
    )

    assert create_response.status_code == 201
    created_data = create_response.json()
    progress_id = created_data["id"]

    update_payload = {
        "distance_covered": 42.0,
        "total_steps": 9000,
        "updated_at": datetime.now().isoformat(),
    }

    update_response = client.put(
        f"/api/v1/challenge_progress/{progress_id}",
        json=update_payload,
        headers=headers
    )

    print(f"PUT /challenge_progress/{progress_id} status: {update_response.status_code}")
    print(f"PUT /challenge_progress/{progress_id} body: {update_response.json()}")

    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["id"] == progress_id
    assert updated_data["distance_covered"] == update_payload["distance_covered"]
    assert updated_data["total_steps"] == update_payload["total_steps"]

# DELETE
def test_delete_challenge_progress_success(client, db_session, test_user, test_challenge):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "user_id": test_user.id,
        "challenge_id": test_challenge.id,
        "distance_covered": 20.0,
        "total_steps": 4000,
        "updated_at": datetime.now().isoformat(),
    }

    create_response = client.post(
        f"/api/v1/challenge_progress/?challenge_id={test_challenge.id}",
        json=payload,
        headers=headers
    )

    assert create_response.status_code == 201
    progress_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/challenge_progress/{progress_id}",
        headers=headers
    )

    print(f"DELETE /challenge_progress/{progress_id} status: {delete_response.status_code}")
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/challenge_progress/{progress_id}",
        headers=headers
    )

    assert get_response.status_code == 404