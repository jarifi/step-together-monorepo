import pytest
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

def test_login_success(client, test_user):
    # Verify endpoint matches your actual route
    response = client.post(
        "/api/v1/auth/login",  # Make sure this matches your actual route
        json={
            "email": "alice1@example.com",
            "password": "StrongPassword123"
        }
    )
    
    # Debug output
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")
    print(f"Test user active: {test_user.is_active}")
    print(f"Test user verified: {test_user.is_verified}")
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_deleted_user_fails(client):
    # 1. Create a user via the API
    create_payload = {
        "name": "Alex",
        "email": "alex_deleted@example.com",
        "password": "StrongPassword123",
        "passwordConfirm": "StrongPassword123",
        "stepLength": 0.8
    }
    create_response = client.post("/api/v1/users/", json=create_payload)
    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    # 2. Log in to get the token required to delete the user
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": create_payload["email"], "password": create_payload["password"]}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Delete the user account via the API
    delete_response = client.delete(
        f"/api/v1/users/{user_id}",
        headers=headers
    )
    assert delete_response.status_code == 200

    # 4. Attempt to log in again with the same credentials
    re_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": create_payload["email"], "password": create_payload["password"]}
    )

    # 5. Assert that the login attempt fails with a 403 Forbidden status code
    assert re_login_response.status_code == 403
    assert re_login_response.json()["detail"] == "Konto deaktiviert."