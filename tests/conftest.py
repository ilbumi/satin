import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator:
    """Create a clean test database connection for each test."""
    # Use test database URL
    client = AsyncMongoMockClient()
    random_name = "satin_test_" + uuid.uuid4().hex
    db = client[random_name]

    yield db

    # Clean up after test
    await client.drop_database(random_name)

    client.close()
