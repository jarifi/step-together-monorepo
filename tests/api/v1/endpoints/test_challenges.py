import pytest
from datetime import datetime, timedelta
from app.models.challenge import Challenge
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def test_creator(db_session):
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

def test_create_challenge_success(client, db_session, test_creator):
    # Verify endpoint matches your actual route
    test_team_id = 1

    payload = {
        "name": "10K Run Challenge",
        "start_location": "Berlin",
        "target_location": "Munich",
        "distance": 585.0,
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "creator_id": test_creator.id,
        "team_id": test_team_id
    }

    response = client.post(
        "/api/v1/challenges/",  # Make sure this matches your actual route
        json=payload
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == payload["name"]
    assert data["start_location"] == payload["start_location"]