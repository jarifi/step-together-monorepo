import pytest
from datetime import datetime
from app.models.user import User
from app.models.team import Team
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
def test_team(db_session):
    """Create a test team"""
    team = Team(name="Test Team")
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    return team

# POST / CREATE
def test_create_team_member_success(client, db_session, test_user, test_team):
    # Verify endpoint matches your actual route
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice1@example.com", "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload = {
        "user_id": test_user.id,
        "team_id": test_team.id,
        "joining_date": datetime.now().isoformat()
    }

    response = client.post(
        "/api/v1/team_members/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == payload["user_id"]
    assert data["team_id"] == payload["team_id"]

# GET ALL
def test_get_all_team_members_success(client, db_session, test_user, test_team):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    payload1 = {
        "user_id": test_user.id,
        "team_id": test_team.id,
        "joining_date": datetime.now().isoformat()
    }
    payload2 = {
        "user_id": test_user.id,
        "team_id": test_team.id,
        "joining_date": datetime.now().isoformat()
    }

    response1 = client.post(
        "/api/v1/team_members/",
        json=payload2,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response1.status_code == 201

    response2 = client.post(
        "/api/v1/team_members/",
        json=payload2,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 201

    get_response = client.get(
        "/api/v1/team_members/",
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"GET /team_members/ respnse status: {get_response.status_code}")
    print(f"GET /team_members/ response body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert isinstance(data,list)
    assert any(
        member["user_id"] == test_user.id and member["team_id"] == test_team.id
        for member in data
    )

# GET BY ID
def test_get_team_member_by_id_success(client, db_session, test_user, test_team):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123"}
    )
    
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "user_id": test_user.id,
        "team_id": test_team.id,
        "joining_date": datetime.now().isoformat()
    }

    create_response = client.post("/api/v1/team_members/", json=payload, headers=headers)
    assert create_response.status_code == 201
    progress_data = create_response.json()
    team_member_id = progress_data["id"]

    get_response = client.get("/api/v1/team_members/", headers=headers)

    print(f"GET /team_members/{team_member_id} status: {get_response.status_code}")
    print(f"GET /team_members/{team_member_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()[0]
    assert data["id"] == team_member_id
    assert data["user_id"] == test_user.id
    assert data["team_id"] == test_team.id

# DELETE
def test_delete_team_member_success(client, db_session, test_user, test_team):
    login_response = client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "StrongPassword123"})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "user_id": test_user.id,
        "team_id": test_team.id,
        "joining_date": datetime.now().isoformat()
    }

    create_response = client.post(
        f"/api/v1/team_members/",
        json=payload,
        headers=headers
    )

    assert create_response.status_code == 201
    team_member_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/team_members/{team_member_id}",
        headers=headers
    )

    print(f"DELETE /team_memberrs/{team_member_id} status: {delete_response.status_code}")
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/team_members/{team_member_id}",
        headers=headers
    )

    assert get_response.status_code == 404