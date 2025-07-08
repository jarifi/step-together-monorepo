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