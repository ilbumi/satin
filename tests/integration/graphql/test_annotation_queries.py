"""Tests for GraphQL annotation queries."""

from fastapi.testclient import TestClient

from tests.conftest import MockDependencies
from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_annotation, create_test_image


class TestAnnotationQueries:
    def test_query_annotations_empty(self, test_client: TestClient):
        """Test querying annotations when none exist."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_annotations"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotations"]["items"] == []
        assert data["data"]["annotations"]["totalCount"] == 0

    async def test_query_annotations_with_data(self, test_client: TestClient, mock_dependencies: MockDependencies):
        """Test querying annotations with sample data."""
        # Create test image first
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        # Create test annotations
        annotation1 = create_test_annotation(image_id=image.id, description="Test annotation 1")
        annotation2 = create_test_annotation(image_id=image.id, description="Test annotation 2")

        await mock_dependencies.annotation_repo.create(annotation1)
        await mock_dependencies.annotation_repo.create(annotation2)

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_annotations"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]["annotations"]["items"]) == 2
        assert data["data"]["annotations"]["totalCount"] == 2

        # Check that annotations have correct properties
        annotation_data = data["data"]["annotations"]["items"][0]
        assert "id" in annotation_data
        assert "imageId" in annotation_data
        assert "boundingBox" in annotation_data
        assert annotation_data["source"] == "manual"

    async def test_query_annotation_by_id(self, test_client: TestClient, mock_dependencies: MockDependencies):
        """Test querying a single annotation by ID."""
        # Create test image and annotation
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))
        annotation_data = create_test_annotation(image_id=image.id, description="Test annotation")
        created = await mock_dependencies.annotation_repo.create(annotation_data)

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_annotation"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotation"]["description"] == "Test annotation"
        assert data["data"]["annotation"]["imageId"] == str(image.id)

    def test_query_annotation_not_found(self, test_client: TestClient):
        """Test querying a non-existent annotation."""
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_annotation"], "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["annotation"] is None

    async def test_query_annotations_by_image(self, test_client: TestClient, mock_dependencies: MockDependencies):
        """Test querying annotations for a specific image."""
        # Create two images
        image1 = await mock_dependencies.image_repo.create(create_test_image("http://test1.com/image.jpg"))
        image2 = await mock_dependencies.image_repo.create(create_test_image("http://test2.com/image.jpg"))

        # Create annotations for each image
        annotation1 = create_test_annotation(image_id=image1.id, description="Image 1 annotation")
        annotation2 = create_test_annotation(image_id=image2.id, description="Image 2 annotation")

        await mock_dependencies.annotation_repo.create(annotation1)
        await mock_dependencies.annotation_repo.create(annotation2)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["annotations_by_image"],
                "variables": {"imageId": str(image1.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotations = data["data"]["annotationsByImage"]
        assert len(annotations) == 1
        assert annotations[0]["description"] == "Image 1 annotation"


class TestAnnotationQueryErrorHandling:
    def test_invalid_annotation_field(self, test_client: TestClient):
        """Test querying with invalid field."""
        invalid_query = """
            query {
                annotations {
                    invalidField
                }
            }
        """

        response = test_client.post("/graphql", json={"query": invalid_query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variable(self, test_client: TestClient):
        """Test query missing required variable."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["get_annotation"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_invalid_image_id_format(self, test_client: TestClient):
        """Test query with invalid image ID format."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["annotations_by_image"],
                "variables": {"imageId": "invalid-id-format"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        # Should return empty list for invalid ID, not error
        assert "data" in data
        assert data["data"]["annotationsByImage"] == []
