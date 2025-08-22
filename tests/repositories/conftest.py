import pytest
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase


@pytest.fixture
async def mock_db() -> AsyncMongoMockDatabase:
    """Create mock database."""
    client = AsyncMongoMockClient()
    return client.test_db
