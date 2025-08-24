"""Global test fixtures and configuration."""

import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase

from satin.app import app
from satin.dependencies import dependencies
from satin.repositories.annotation import AnnotationRepository
from satin.repositories.image import ImageRepository
from satin.repositories.ml_job import MLJobRepository
from satin.repositories.tag import TagRepository


class MockDependencies:
    """Mock dependencies for testing."""

    def __init__(self, mock_db: AsyncMongoMockDatabase):
        self.image_repo = ImageRepository(mock_db)
        self.annotation_repo = AnnotationRepository(mock_db)
        self.tag_repo = TagRepository(mock_db)
        self.ml_job_repo = MLJobRepository(mock_db)


@pytest.fixture
async def mock_db() -> AsyncGenerator[AsyncMongoMockDatabase]:
    """Create mock database."""
    client = AsyncMongoMockClient()
    yield client.test_db
    client.close()


@pytest.fixture
async def mock_dependencies(mock_db: AsyncMongoMockDatabase) -> MockDependencies:
    """Create mock dependencies."""
    return MockDependencies(mock_db)


@pytest.fixture
def test_client(mock_dependencies: MockDependencies) -> TestClient:
    """Create test client with mocked dependencies."""
    # Override the global dependencies
    dependencies.image_repo = mock_dependencies.image_repo
    dependencies.annotation_repo = mock_dependencies.annotation_repo
    dependencies.tag_repo = mock_dependencies.tag_repo
    dependencies.ml_job_repo = mock_dependencies.ml_job_repo

    return TestClient(app)


@pytest.fixture
def mock_env():
    """Mock environment variables fixture."""
    return {"SATIN_MONGO_DSN": "mongodb://localhost:27017/test"}


@pytest.fixture
def clean_env(mock_env):
    """Clean environment with minimal required variables."""
    with patch.dict(os.environ, mock_env, clear=True):
        yield
