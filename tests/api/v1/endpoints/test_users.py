import pytest
from datetime import datetime

def test_create_user_success(client, db_session):
    # Verify endpoint matches your actual route
    payload = {
        "name": "Alice",
        "email": "alice2@example.com",
        "password": "StrongPassword123",
        "password_confirm": "StrongPassword123",
        "step_length": 0.75,
    }

    response = client.post(
        "/api/v1/users/",  # Make sure this matches your actual route
        json=payload
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["is_active"] is True
    assert data["is_verified"] is False