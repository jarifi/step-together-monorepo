import pytest
from datetime import datetime
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

# POST / CREATE
def test_create_team_success(client, db_session, test_user):
    # Verify endpoint matches your actual route
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice1@example.com", "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload = {
        "name": "Amazing Runners",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat()
    }

    response = client.post(
        "/api/v1/teams/",  # Make sure this matches your actual route
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == payload["name"]
    assert data["creator_id"] == payload["creator_id"]

# GET / READ
def test_get_all_teams(client, db_session, test_user):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload1 = {
        "name": "Fast Flyers",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat()
    }
    payload2 = {
        "name": "Trail Blazers",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat()
    }

    response1 = client.post(
        "/api/v1/teams/",
        json=payload1,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response1.status_code == 201

    response2 = client.post(
        "/api/v1/teams/",
        json=payload2,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 201

    get_response = client.get(
        "/api/v1/teams/",
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"GET /teams/ response status: {get_response.status_code}")
    print(f"GET /teams/ response body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert isinstance(data, list)

    assert any (team["name"] == "Fast Flyers" for team in data)
    assert any (team["name"] == "Trail Blazers" for team in data)
    assert any (team["creator_id"] == test_user.id for team in data)

# GET BY ID
def test_get_team_by_id(client, db_session, test_user):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Fast Flyers",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat()
    }

    create_response = client.post("/api/v1/teams/", json=payload, headers=headers)
    assert create_response.status_code == 201
    progress_data = create_response.json()
    team_id = progress_data["id"]

    get_response = client.get("/api/v1/teams/", headers=headers)

    print(f"GET /teams/{team_id} status: {get_response.status_code}")
    print(f"GET /teams/{team_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()[0]
    assert data["id"] == team_id
    assert data["creator_id"] == test_user.id

# PUT / UPDATE
def test_update_team_success(client, db_session, test_user):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "name": "Fast Flyers",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat() 
    }
    create_response = client.post(
        f"/api/v1/teams/",
        json=create_payload,
        headers=headers
    )

    assert create_response.status_code == 201
    created_data = create_response.json()
    team_id = created_data["id"]

    update_payload = {
        "name": "Speedy Flyers",
        "updated_at": datetime.now().isoformat(),
    }

    update_response = client.put(
        f"/api/v1/teams/{team_id}",
        json=update_payload,
        headers=headers
    )

    print(f"PUT /challenge_progress/{team_id} status: {update_response.status_code}")
    print(f"PUT /challenge_progress/{team_id} body: {update_response.json()}")

    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["id"] == team_id
    assert updated_data["name"] == update_payload["name"]

# DELETE
def test_delete_team_success(client, db_session, test_user):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Fast Flyers",
        "creator_id": test_user.id,
        "updated_at": datetime.now().isoformat() 
    }

    create_response = client.post(
        f"/api/v1/teams/",
        json=payload,
        headers=headers
    )

    assert create_response.status_code == 201
    team_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/teams/{team_id}",
        headers=headers
    )

    print(f"DELETE /teams/{team_id} status: {delete_response.status_code}")
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/teams/{team_id}",
        headers=headers
    )

    assert get_response.status_code == 404