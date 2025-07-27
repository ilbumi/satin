import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from satin.main import create_app


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


@pytest.fixture
def graphql_client(test_db, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """Create a test client for GraphQL testing."""
    # Patch the database connection
    monkeypatch.setattr("satin.schema.task.db", test_db)
    monkeypatch.setattr("satin.schema.project.db", test_db)
    monkeypatch.setattr("satin.schema.image.db", test_db)

    app = create_app()
    return TestClient(app)


class GraphQLTestClient:
    """Helper class for executing GraphQL operations in tests."""

    def __init__(self, client: TestClient):
        self.client = client
        self.graphql_url = "/graphql"

    def execute(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
        operation_name: str | None = None,
    ) -> dict[str, Any]:
        """Execute a GraphQL query or mutation."""
        payload = {"query": query}

        if variables:
            payload["variables"] = variables
        if operation_name:
            payload["operationName"] = operation_name

        response = self.client.post(
            self.graphql_url,
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 200, f"GraphQL request failed: {response.text}"

        return response.json()

    def query(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a GraphQL query and return the data."""
        result = self.execute(query, variables)

        if "errors" in result:
            pytest.fail(f"GraphQL query failed: {result['errors']}")

        return result.get("data", {})

    def mutate(
        self,
        mutation: str,
        variables: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a GraphQL mutation and return the data."""
        result = self.execute(mutation, variables)

        if "errors" in result:
            pytest.fail(f"GraphQL mutation failed: {result['errors']}")

        return result.get("data", {})

    def query_with_errors(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any] | None, list[dict[str, Any]] | None]:
        """Execute a GraphQL query and return both data and errors."""
        result = self.execute(query, variables)
        return result.get("data"), result.get("errors")


@pytest.fixture
def gql(graphql_client: TestClient) -> GraphQLTestClient:
    """Create a GraphQL test client."""
    return GraphQLTestClient(graphql_client)


# Common test data factories
class TestDataFactory:
    """Factory for creating test data."""

    @staticmethod
    def create_project_input(name: str = "Test Project", description: str = "Test Description") -> dict[str, Any]:
        """Create project input data."""
        return {"name": name, "description": description}

    @staticmethod
    def create_image_input(url: str = "https://example.com/test-image.jpg") -> dict[str, Any]:
        """Create image input data."""
        return {"url": url}

    @staticmethod
    def create_annotation_input(text: str = "test object", tags: list[str] | None = None) -> dict[str, Any]:
        """Create annotation input data."""
        if tags is None:
            tags = ["object", "test"]
        return {"text": text, "tags": tags}

    @staticmethod
    def create_bbox_input(
        x: float = 10.0,
        y: float = 20.0,
        width: float = 100.0,
        height: float = 200.0,
        annotation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create bounding box input data."""
        if annotation is None:
            annotation = TestDataFactory.create_annotation_input()
        return {"x": x, "y": y, "width": width, "height": height, "annotation": annotation}

    @staticmethod
    def create_task_input(
        image_id: str,
        project_id: str,
        bboxes: list[dict[str, Any]] | None = None,
        status: str = "DRAFT",
    ) -> dict[str, Any]:
        """Create task input data."""
        if bboxes is None:
            bboxes = [TestDataFactory.create_bbox_input()]
        return {"imageId": image_id, "projectId": project_id, "bboxes": bboxes, "status": status}


@pytest.fixture
def test_data() -> TestDataFactory:
    """Provide test data factory."""
    return TestDataFactory
