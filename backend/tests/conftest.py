import pytest
import sys
import json
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, Text, TypeDecorator
from sqlalchemy.orm import sessionmaker

# Create a custom type decorator for SQLite testing
class TextJSON(TypeDecorator):
    """Stores JSON-serialized data in a TEXT column for SQLite."""
    impl = Text
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value

# Mock pgvector before any imports to use TextJSON for SQLite
sys.modules['pgvector'] = MagicMock()
sys.modules['pgvector.sqlalchemy'] = MagicMock()
sys.modules['pgvector.sqlalchemy'].Vector = lambda dim: TextJSON()

# Now safe to import app modules
from app.db import Base, get_db
from app.main import app, get_current_user
from app.models import User

# Use file-based SQLite for tests (allows multiple connections)
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test function."""
    import os
    # Clean up any existing test database
    if os.path.exists("./test.db"):
        os.remove("./test.db")
    
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        # Clean up test database file
        if os.path.exists("./test.db"):
            os.remove("./test.db")

@pytest.fixture(scope="function")
def test_client(test_db):
    """Create a test client with test database."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    client = TestClient(app)
    yield client
    
    # Clean up
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def mock_auth(test_db):
    """Mock authentication to return a test user."""
    # Create test user
    test_user = User(
        auth0_sub="test|123456",
        email="test@example.com"
    )
    test_db.add(test_user)
    test_db.commit()
    test_db.refresh(test_user)
    
    def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    yield test_user
    
    # Clean up
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def authenticated_client(test_client, mock_auth):
    """Create authenticated test client."""
    return test_client

