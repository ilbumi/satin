"""Tests for GraphQL API."""

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase

from satin.app import app
from satin.dependencies import dependencies
from satin.models.image import ImageCreate
from satin.repositories.annotation import AnnotationRepository
from satin.repositories.image import ImageRepository
from satin.repositories.ml_job import MLJobRepository
from satin.repositories.tag import TagRepository


class MockDependencies:
    def __init__(self, mock_db):
        self.image_repo = ImageRepository(mock_db)
        self.annotation_repo = AnnotationRepository(mock_db)
        self.tag_repo = TagRepository(mock_db)
        self.ml_job_repo = MLJobRepository(mock_db)


@pytest.fixture
async def mock_db() -> AsyncMongoMockDatabase:
    """Create mock database."""
    client = AsyncMongoMockClient()
    return client.test_db


@pytest.fixture
async def mock_dependencies(mock_db: AsyncMongoMockDatabase):
    """Create mock dependencies."""
    return MockDependencies(mock_db)


@pytest.fixture
def client(mock_dependencies) -> TestClient:
    """Create test client with mocked dependencies."""
    # Override the global dependencies
    dependencies.image_repo = mock_dependencies.image_repo
    dependencies.annotation_repo = mock_dependencies.annotation_repo
    dependencies.tag_repo = mock_dependencies.tag_repo
    dependencies.ml_job_repo = mock_dependencies.ml_job_repo

    return TestClient(app)


class TestGraphQLQueries:
    """Test GraphQL queries."""

    def test_query_images_empty(self, client: TestClient):
        """Test querying images when none exist."""
        query = """
            query {
                images {
                    id
                    url
                    status
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["images"] == []

    async def test_query_images_with_data(self, client: TestClient, mock_dependencies):
        """Test querying images when they exist."""
        # Create test images
        await mock_dependencies.image_repo.create(ImageCreate(url="http://test1.com/image.jpg"))
        await mock_dependencies.image_repo.create(ImageCreate(url="http://test2.com/image.png"))

        query = """
            query {
                images {
                    id
                    url
                    status
                    width
                    height
                    ext
                    createdAt
                    updatedAt
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]["images"]) == 2
        assert data["data"]["images"][0]["url"] == "http://test1.com/image.jpg"
        assert data["data"]["images"][0]["status"] == "NEW"
        assert data["data"]["images"][1]["url"] == "http://test2.com/image.png"

    async def test_query_image_by_id(self, client: TestClient, mock_dependencies):
        """Test querying a single image by ID."""
        # Create test image
        created = await mock_dependencies.image_repo.create(ImageCreate(url="http://test.com/image.jpg"))

        query = """
            query GetImage($id: String!) {
                image(id: $id) {
                    id
                    url
                    status
                }
            }
        """

        response = client.post(
            "/graphql",
            json={"query": query, "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["image"]["url"] == "http://test.com/image.jpg"
        assert data["data"]["image"]["status"] == "NEW"

    def test_query_image_not_found(self, client: TestClient):
        """Test querying a non-existent image."""
        query = """
            query GetImage($id: String!) {
                image(id: $id) {
                    id
                    url
                }
            }
        """

        response = client.post(
            "/graphql",
            json={"query": query, "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["image"] is None


class TestGraphQLMutations:
    """Test GraphQL mutations."""

    def test_create_image(self, client: TestClient):
        """Test creating an image via GraphQL."""
        mutation = """
            mutation CreateImage($input: ImageCreateInput!) {
                createImage(input: $input) {
                    id
                    url
                    status
                }
            }
        """

        response = client.post(
            "/graphql",
            json={
                "query": mutation,
                "variables": {"input": {"url": "http://test.com/new.jpg"}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["createImage"]["url"] == "http://test.com/new.jpg"
        assert data["data"]["createImage"]["status"] == "NEW"
        assert data["data"]["createImage"]["id"] is not None

    async def test_update_image_status(self, client: TestClient, mock_dependencies):
        """Test updating an image's status."""
        # Create test image
        created = await mock_dependencies.image_repo.create(ImageCreate(url="http://test.com/image.jpg"))

        mutation = """
            mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
                updateImage(id: $id, input: $input) {
                    id
                    url
                    status
                }
            }
        """

        response = client.post(
            "/graphql",
            json={
                "query": mutation,
                "variables": {
                    "id": str(created.id),
                    "input": {"status": "ANNOTATED"},
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateImage"]["status"] == "ANNOTATED"

    async def test_update_image_no_changes(self, client: TestClient, mock_dependencies):
        """Test updating an image with no changes."""
        # Create test image
        created = await mock_dependencies.image_repo.create(ImageCreate(url="http://test.com/image.jpg"))

        mutation = """
            mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
                updateImage(id: $id, input: $input) {
                    id
                    url
                    status
                }
            }
        """

        response = client.post(
            "/graphql",
            json={
                "query": mutation,
                "variables": {"id": str(created.id), "input": {}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateImage"]["status"] == "NEW"

    def test_update_nonexistent_image(self, client: TestClient):
        """Test updating a non-existent image."""
        mutation = """
            mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
                updateImage(id: $id, input: $input) {
                    id
                }
            }
        """

        response = client.post(
            "/graphql",
            json={
                "query": mutation,
                "variables": {
                    "id": "nonexistent",
                    "input": {"status": "ANNOTATED"},
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateImage"] is None

    async def test_delete_image(self, client: TestClient, mock_dependencies):
        """Test deleting an image."""
        # Create test image
        created = await mock_dependencies.image_repo.create(ImageCreate(url="http://test.com/image.jpg"))

        mutation = """
            mutation DeleteImage($id: String!) {
                deleteImage(id: $id)
            }
        """

        response = client.post(
            "/graphql",
            json={"query": mutation, "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteImage"] is True

        # Verify it's deleted
        deleted = await mock_dependencies.image_repo.get_by_id(created.id)
        assert deleted is None

    def test_delete_nonexistent_image(self, client: TestClient):
        """Test deleting a non-existent image."""
        mutation = """
            mutation DeleteImage($id: String!) {
                deleteImage(id: $id)
            }
        """

        response = client.post(
            "/graphql",
            json={"query": mutation, "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteImage"] is False


class TestGraphQLErrorHandling:
    """Test GraphQL error handling."""

    def test_invalid_query_syntax(self, client: TestClient):
        """Test handling of invalid query syntax."""
        query = """
            query {
                images {
                    invalid_field
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variable(self, client: TestClient):
        """Test handling of missing required variables."""
        query = """
            query GetImage($id: String!) {
                image(id: $id) {
                    id
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_invalid_mutation_input(self, client: TestClient):
        """Test handling of invalid mutation input."""
        mutation = """
            mutation CreateImage($input: ImageCreateInput!) {
                createImage(input: $input) {
                    id
                }
            }
        """

        response = client.post(
            "/graphql",
            json={"query": mutation, "variables": {"input": {}}},  # Missing url
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data


class TestGraphQLIntrospection:
    """Test GraphQL introspection capabilities."""

    def test_introspection_query(self, client: TestClient):
        """Test that introspection queries work."""
        query = """
            query {
                __schema {
                    types {
                        name
                    }
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        type_names = [t["name"] for t in data["data"]["__schema"]["types"]]
        assert "Image" in type_names
        assert "Query" in type_names
        assert "Mutation" in type_names

    def test_field_introspection(self, client: TestClient):
        """Test introspection of specific type fields."""
        query = """
            query {
                __type(name: "Image") {
                    fields {
                        name
                        type {
                            name
                        }
                    }
                }
            }
        """

        response = client.post("/graphql", json={"query": query})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        field_names = [f["name"] for f in data["data"]["__type"]["fields"]]
        assert "id" in field_names
        assert "url" in field_names
        assert "status" in field_names
        assert "createdAt" in field_names
        assert "updatedAt" in field_names
