# File: tests/api/v1/endpoints/test_auth.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.user import User
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash

# ✅ Use a dedicated test database
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root@localhost:3306/step_together_api_test"

# Setup test engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Override the get_db dependency to use test DB ---
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

# --- DB Setup and Teardown ---
@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create a test user
    db = TestingSessionLocal()
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword")
    )
    db.add(user)
    db.commit()
    db.close()

    yield  # Run the tests

    # Teardown: Drop all tables
    Base.metadata.drop_all(bind=engine)

# --- Actual test ---
def test_login_success():
    response = client.post(
        "/api/v1/login",  # Adjust if you mount router differently
        json={"email": "test@example.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_wrong_password():
    response = client.post(
        "/api/v1/login",
        json={"email": "test@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid credentials"

def test_login_user_not_found():
    response = client.post(
        "/api/v1/login",
        json={"email": "nouser@example.com", "password": "any"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid credentials"
