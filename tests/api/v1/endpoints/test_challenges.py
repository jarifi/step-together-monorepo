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

def test_get_all_challenges(client, db_session, test_creator):
    team_id = 1

    challenge1 = {
        "name": "5K Walk Challenge",
        "start_location": "Hamburg",
        "target_location": "Frankfurt",
        "distance": 300.0,
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=15)).isoformat(),
        "creator_id": test_creator.id,
        "team_id": team_id
    }
    challenge2 = {
        "name": "Marathon Challenge",
        "start_location": "Paris",
        "target_location": "Lyon",
        "distance": 42195.0,
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=60)).isoformat(),
        "creator_id": test_creator.id,
        "team_id": team_id
    }

    client.post("/api/v1/challenges/", json=challenge1)
    client.post("/api/v1/challenges/", json=challenge2)

    response = client.get("/api/v1/challenges/")
    print(f"GET /challenges response status: {response.status_code}")
    print(f"GET /challenges response body: {response.json()}")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(ch["name"] == "5K Walk Challenge" for ch in data)
    assert any(ch["name"] == "Marathon Challenge" for ch in data)