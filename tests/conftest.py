import asyncio
import uuid
from contextlib import suppress
from typing import Any

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from satin.main import create_app
from satin.repositories import ImageRepository, ProjectRepository, TaskRepository
from satin.repositories.factory import RepositoryFactory


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


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


# Database factory methods - create databases in the current event loop
class DatabaseFactory:
    """Factory for creating test databases and repositories."""

    @staticmethod
    async def create_test_db():
        """Create a clean test database connection in the current event loop."""
        client = AsyncMongoMockClient()
        random_name = "satin_test_" + uuid.uuid4().hex
        db = client[random_name]
        return db, client

    @staticmethod
    async def cleanup_test_db(db, client):
        """Clean up test database and client."""
        with suppress(Exception):
            await client.drop_database(db.name)
        with suppress(Exception):
            client.close()

    @staticmethod
    async def create_repositories(db):
        """Create repository instances for testing."""
        return {
            "project_repo": ProjectRepository(db),
            "image_repo": ImageRepository(db),
            "task_repo": TaskRepository(db),
        }

    @staticmethod
    async def create_test_context():
        """Create complete test context with database and repositories."""
        db, client = await DatabaseFactory.create_test_db()
        repos = await DatabaseFactory.create_repositories(db)
        return db, client, repos

    @staticmethod
    def create_graphql_client(db, monkeypatch):
        """Create a GraphQL test client with proper database mocking."""
        test_repo_factory = RepositoryFactory(db)

        # Patch the global repo_factory instances in query and mutation modules
        monkeypatch.setattr("satin.schema.query.repo_factory", test_repo_factory)
        monkeypatch.setattr("satin.schema.mutation.repo_factory", test_repo_factory)

        app = create_app()
        return GraphQLTestClient(TestClient(app))


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
