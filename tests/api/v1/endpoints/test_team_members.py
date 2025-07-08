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
        "/api/v1/team_members/",  # Make sure this matches your actual route
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