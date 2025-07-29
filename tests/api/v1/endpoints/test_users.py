import pytest
from datetime import datetime

# POST / CREATE
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

# GET / READ
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

# GET BY ID
def test_get_user_by_id(client, db_session):
    payload = {
        "name": "Alice",
        "email": "alice2@example.com",
        "password": "StrongPassword123",
        "password_confirm": "StrongPassword123",
        "step_length": 0.75,
    }

    create_response = client.post("/api/v1/users/", json=payload)
    assert create_response.status_code == 201
    progress_data = create_response.json()
    users_id = progress_data["id"]

    login_response = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    get_response = client.get(f"/api/v1/users/{users_id}", headers=headers)

    get_response = client.get("/api/v1/users/", headers=headers)

    print(f"GET /users/{users_id} status: {get_response.status_code}")
    print(f"GET /users/{users_id} body: {get_response.json()}")

    assert get_response.status_code == 200
    data = get_response.json()[0]
    assert data["id"] == users_id

# PUT / UPDATE
def test_update_user_success(client, db_session):
    create_payload = {
        "name": "Alice",
        "email": "alice2@example.com",
        "password": "StrongPassword123",
        "password_confirm": "StrongPassword123",
        "step_length": 0.75,
    }

    create_response = client.post(
    f"/api/v1/users/",
    json=create_payload
    )

    assert create_response.status_code == 201
    created_data = create_response.json()
    user_id = created_data["id"]

    login_response = client.post("/api/v1/auth/login", json={"email": create_payload["email"], "password": create_payload["password"]})

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "name": "Alex",
        "email": "alex2@example.com",
        "updated_at": datetime.now().isoformat(),
    }

    update_response = client.put(
        f"/api/v1/users/{user_id}",
        json=update_payload,
        headers=headers
    )

    print(f"PUT /users/{user_id} status: {update_response.status_code}")
    print(f"PUT /users/{user_id} body: {update_response.json()}")

    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["id"] == user_id
    assert updated_data["name"] == update_payload["name"]
    assert updated_data["email"] == update_payload["email"]