import pytest
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def test_users(db_session):
    """Test user with all required fields"""
    users_data = [
        {"name": "Alice", "email": "alice@example.com", "password": "Password123"},
        {"name": "Bob", "email": "bob@example.com", "password": "Password456"},
        {"name": "Charlie", "email": "charlie@example.com", "password": "Password789"},
    ]

    users = []
    for data in users_data:
        user = User(
            name=data["name"],
            email=data["email"],
            hashed_password=get_password_hash(data["password"]),
            is_active=True,  # CRITICAL
            is_verified=True  # CRITICAL
        )
        db_session.add(user)
        users.append((user, data["password"]))

    db_session.commit()
    for user, _ in users:
        db_session.refresh(user)
        db_session.expunge(user)
    return users

def test_login_success(client, test_users):
    # Verify endpoint matches your actual route
    for user, password in test_users:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": password}
    )
    
    # Debug output
    print(f"Testing login for: {user.email}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"