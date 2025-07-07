# tests/conftest.py
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base # Assuming you have a Base for declarative models
from app.db.session import get_db # Import the actual get_db to override it
from app.main import app # Import your main FastAPI app instance
from app.core.security import get_password_hash # Needed to hash passwords for test users

# Create a test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
# For in-memory SQLite, use "sqlite:///:memory:"
# SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db_session")
def db_session_fixture():
    """
    Provides a test database session.
    Each test will get a clean slate.
    """
    Base.metadata.create_all(bind=engine)  # Create tables
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)  # Drop tables after test


@pytest.fixture(name="client")
def client_fixture(db_session):
    """
    Provides a FastAPI test client with an overridden database dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear() # Clean up overrides after tests