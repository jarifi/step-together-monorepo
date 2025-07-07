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