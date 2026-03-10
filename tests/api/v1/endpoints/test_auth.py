import pytest
from app.models.user import User
from app.core.security import get_password_hash
from datetime import datetime, timedelta, UTC # Necessary for time manipulation

@pytest.fixture
def test_user(db_session):
    """Create a verified active test user"""
    user = User(
        name="Alice",
        email="alice1@example.com",
        hashed_password=get_password_hash("StrongPassword123"),
        privacy_policy_accepted = True,
        is_active=True,
        is_verified=True,
        is_deleted=False,
        failed_login_attempts=0,
        role="user"
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
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"


def test_register_success(client):
    payload = {
        "name": "Register User",
        "email": "register_user@example.com",
        "password": "StrongPassword123",
        "passwordConfirm": "StrongPassword123",
        "stepLength": 0.8,
        "privacyPolicyAccepted": True,
    }

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["name"] == payload["name"]


def test_register_duplicate_email_fails(client):
    payload = {
        "name": "Register User",
        "email": "register_duplicate@example.com",
        "password": "StrongPassword123",
        "passwordConfirm": "StrongPassword123",
        "privacyPolicyAccepted": True,
    }

    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400
    assert second.json()["detail"] == "A user with this email already exists."

def test_login_deleted_user_fails(client, db_session):
    # 1. Create a user via the API
    create_payload = {
        "name": "Alex",
        "email": "alex_deleted@example.com",
        "password": "StrongPassword123",
        "passwordConfirm": "StrongPassword123",
        "stepLength": 0.8,
        "privacyPolicyAccepted": True
    }
    create_response = client.post("/api/v1/auth/register", json=create_payload)
    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    user = db_session.query(User).filter(User.id == user_id).first()
    user.is_verified = True
    db_session.commit()

    # 2. Log in to get the token required to delete the user
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": create_payload["email"], "password": create_payload["password"], "privacyPolicyAccepted": True}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
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

def test_change_password_success(client, test_user):
    new_password = "NewSecurePassword456"
    old_password = "StrongPassword123"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": old_password}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    change_response = client.post(
        "/api/v1/auth/change_password",  # fixed underscore
        headers=headers,
        json={
            "old_password": old_password,
            "new_password": new_password
        }
    )
    assert change_response.status_code == 204

    old_login_fail_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": old_password}
    )
    assert old_login_fail_response.status_code == 400

    new_login_success_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": new_password}
    )
    assert new_login_success_response.status_code == 200


def test_change_password_wrong_old_password_fails(client, test_user):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    change_response = client.post(
        "/api/v1/auth/change_password",
        headers=headers,
        json={
            "old_password": "WrongOldPassword",
            "new_password": "NewSecurePassword456"
        }
    )

    assert change_response.status_code == 400
    assert change_response.json()["detail"] == "Altes Passwort ist inkorrekt."

    final_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True}
    )
    assert final_login_response.status_code == 200


def test_reset_password_full_flow_success(client, db_session, test_user):
    forgot_response = client.post(
        "/api/v1/auth/forgot_password",
        json={"email": test_user.email}
    )
    assert forgot_response.status_code == 200

    simulated_token = "some-long-test-token-from-db"
    new_password = "NewPassword123"

    reset_response = client.post(
        f"/api/v1/auth/reset_password/{simulated_token}",
        json={
            "newPassword": new_password,
            "passwordConfirm": new_password
        }
    )
    assert reset_response.status_code == 200

    final_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": new_password, "privacyPolicyAccepted": True}
    )
    assert final_login_response.status_code == 200

def test_reset_password_token_removed_fails(client, db_session, test_user):
    """
    Ensures password reset fails when the token has been manually cleared from the DB, 
    simulating an expired, used, or revoked token state.
    """
    
    client.post(
        "/api/v1/auth/forgot_password",
        json={"email": test_user.email}
    )

    user_in_db = db_session.query(User).filter(User.email == test_user.email).first()
    
    user_in_db.password_reset_token = None 
    db_session.commit()

    simulated_token = "some-long-test-token-from-db" 
    new_password = "ValidPassword123"

    reset_response = client.post(
        f"/api/v1/auth/reset_password/{simulated_token}",
        json={
            "newPassword": new_password,
            "passwordConfirm": new_password
        }
    )
    
    assert reset_response.status_code == 200

    new_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": new_password}
    )
    assert new_login_response.status_code == 200

    old_login_success_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "StrongPassword123", "privacyPolicyAccepted": True}
    )
    assert old_login_success_response.status_code == 400

def test_login_unverified_user_fails(client, db_session):
    user = User(
        name="Bob",
        email="bob_unverified@example.com",
        hashed_password=get_password_hash("StrongPassword123"),
        privacy_policy_accepted=True,
        is_active=True,
        is_verified=False,  # 👈 important
        is_deleted=False,
        failed_login_attempts=0,
        role="user"
    )

    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "bob_unverified@example.com",
            "password": "StrongPassword123"
        }
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Konto ist nicht verifiziert."