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

def test_get_all_users(client, db_session):

    payload = {
        "name": "Alice",
        "email": "alice2@example.com",
        "password": "StrongPassword123",
        "password_confirm": "StrongPassword123",
        "step_length": 0.75,
    }

    create_response = client.post("/api/v1/users/", json=payload)
    assert create_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice2@example.com", "password": "StrongPassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    get_response = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"}
    )

    print(f"GET /users/ response status: {get_response.status_code}")
    print(f"GET /users/ response body: {get_response.json()}")

    assert get_response.status_code == 200
    users = get_response.json()
    assert isinstance(users, list)
    assert any(u["email"] == payload["email"] for u in users)