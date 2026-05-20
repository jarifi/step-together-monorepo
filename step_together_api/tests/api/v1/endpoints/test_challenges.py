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
        privacy_policy_accepted = True,
        is_active=True,  # CRITICAL
        is_verified=True  # CRITICAL
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# POST / CREATE
def test_create_challenge_success(client, test_user):
    # Verify endpoint matches your actual route
    login_response = client.post("/api/v1/auth/login", json={"email": "alice1@example.com", "password": "StrongPassword123", "privacyPolicyAccepted": True})

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]

    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=10)).isoformat()

    challenge_payload = {
        "name": "10K Run Challenge",
        "startLocation": "Berlin",
        "targetLocation": "Munich",
        "distance": 585.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
        "creatorId": test_user.id,
        "teamId": 1
    }

    response = client.post(
        "/api/v1/challenges/",
        json=challenge_payload, headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["name"] == challenge_payload["name"]


def test_create_challenge_allows_overlapping_periods(client, test_user):
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "StrongPassword123",
            "privacyPolicyAccepted": True,
        },
    )

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    start_date = datetime.now()
    end_date = start_date + timedelta(days=30)

    first_payload = {
        "name": "Spring Challenge",
        "startLocation": "Berlin",
        "targetLocation": "Leipzig",
        "distance": 190.0,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "creatorId": test_user.id,
        "teamId": 1,
    }
    second_payload = {
        "name": "Parallel Challenge",
        "startLocation": "Hamburg",
        "targetLocation": "Bremen",
        "distance": 125.0,
        "startDate": (start_date + timedelta(days=5)).isoformat(),
        "endDate": (end_date - timedelta(days=5)).isoformat(),
        "creatorId": test_user.id,
        "teamId": 1,
    }

    first_response = client.post(
        "/api/v1/challenges/",
        json=first_payload,
        headers=headers,
    )
    second_response = client.post(
        "/api/v1/challenges/",
        json=second_payload,
        headers=headers,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["name"] == second_payload["name"]

# GET / READ
def test_get_all_challenges_success(client, db_session, test_user):
    login_response = client.post( "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True})
    
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]

    headers = {"Authorization": f"Bearer {token}"}
    teamId = 1

    challenge1 = {
        "name": "5K Walk Challenge",
        "startLocation": "Hamburg",
        "targetLocation": "Frankfurt",
        "distance": 300.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=15)).isoformat(),
        "creatorId": test_user.id,
        "teamId": teamId
    }
    challenge2 = {
        "name": "Marathon Challenge",
        "startLocation": "Paris",
        "targetLocation": "Lyon",
        "distance": 42195.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=60)).isoformat(),
        "creatorId": test_user.id,
        "teamId": teamId
    }

    client.post("/api/v1/challenges/", json=challenge1, headers=headers)
    client.post("/api/v1/challenges/", json=challenge2, headers=headers)

    response = client.get("/api/v1/challenges/", headers=headers)

    print(f"GET /challenges response status: {response.status_code}")
    print(f"GET /challenges response body: {response.json()}")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(ch["name"] == "5K Walk Challenge" for ch in data)
    assert any(ch["name"] == "Marathon Challenge" for ch in data)
    
# GET BY ID
def test_get_challenge_by_id_success(client, db_session, test_user):
    login_response = client.post("/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True})
    
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "City Sprint Challenge",
        "startLocation": "Cologne",
        "targetLocation": "Düsseldorf",
        "distance": 45.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
        "creatorId": test_user.id,
        "teamId": 1
    }
    create_response = client.post("/api/v1/challenges/", json=payload, headers=headers)
    assert create_response.status_code == 201
    challenge_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/challenges/{challenge_id}", headers=headers)

    print(f"GET /challenges/{challenge_id} status: {get_response.status_code}")
    print(f"GET /challenges/{challenge_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    retrieved = get_response.json()
    assert retrieved["id"] == challenge_id
    assert retrieved["name"] == payload["name"]
    assert retrieved["startLocation"] == payload["startLocation"]
    assert retrieved["targetLocation"] == payload["targetLocation"]

# PUT / UPDATE
def test_update_challenge_success(client, test_user):
    login_response = client.post( "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True})

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "name": "City Challenge",
        "startLocation": "Cologne",
        "targetLocation": "Düsseldorf",
        "distance": 50.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
        "creatorId": test_user.id,
        "teamId": 1
    }
    create_response = client.post(
        f"/api/v1/challenges/",
        json=create_payload,
        headers=headers
    )
    assert create_response.status_code == 201
    challenge_id = create_response.json()["id"]

    update_payload = {
        "name": "New City Challenge",
        "distance": 80.0,
        "updated_at": datetime.now().isoformat(),
    }

    update_response = client.put(
        f"/api/v1/challenges/{challenge_id}",
        json=update_payload,
        headers=headers
    )

    print(f"PUT /challenges/{challenge_id} status: {update_response.status_code}")
    print(f"PUT /challenges/{challenge_id} body: {update_response.json()}")

    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["id"] == challenge_id
    assert updated_data["name"] == update_payload["name"]
    assert updated_data["distance"] == update_payload["distance"]

# DELETE
def test_delete_challenge_success(client, test_user):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True})

    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "City Challenge",
        "startLocation": "Cologne",
        "targetLocation": "Düsseldorf",
        "distance": 50.0,
        "startDate": datetime.now().isoformat(),
        "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
        "creatorId": test_user.id,
        "teamId": 1,
        "state": "incoming"
    }

    create_response = client.post(
        f"/api/v1/challenges/",
        json=payload,
        headers=headers
    )

    assert create_response.status_code == 201
    challenge_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/challenges/{challenge_id}",
        headers=headers
    )

    print(f"DELETE /challenges/{challenge_id} status: {delete_response.status_code}")
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/challenges/{challenge_id}",
        headers=headers
    )

    assert get_response.status_code == 404