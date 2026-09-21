import os
import sys
from pathlib import Path

# Ensure dummy GEMINI_API_KEY is configured before any app modules are imported
os.environ.setdefault("GEMINI_API_KEY", "mock-test-gemini-key")

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.base import Base
from app.db.database import get_db
from app.main import app as fastapi_app
import app.main


# In-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="session", autouse=True)
def disable_lifespan_init_db():
    """Bypass Postgres init_db() in app lifespan during tests."""
    with patch.object(app.main, "init_db", return_value=None):
        yield


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh SQLite database session for each test function."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app, raise_server_exceptions=True) as c:
        yield c
    fastapi_app.dependency_overrides.clear()



@pytest.fixture
def mock_gemini_client():
    """Fixture that mocks the Google GenAI Client to prevent live API calls."""
    mock_client = MagicMock()
    with patch("app.services.embedding_service.client", mock_client), \
         patch("app.services.llm_service.client", mock_client):
        yield mock_client
