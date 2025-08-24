"""Tests for GraphQL annotation mutations."""

from fastapi.testclient import TestClient

from satin.models.annotation import AnnotationUpdate
from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_annotation, create_test_image, create_test_tag


class TestAnnotationMutations:
    async def test_create_annotation(self, test_client: TestClient, mock_dependencies):
        """Test creating a new annotation."""
        # Create test image first
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        # Create test tag first
        tag = await mock_dependencies.tag_repo.create_hierarchical(create_test_tag(name="test_tag"))

        annotation_input = {
            "imageId": str(image.id),
            "boundingBox": {"x": 10.0, "y": 20.0, "width": 100.0, "height": 50.0},
            "description": "Test annotation",
            "tags": [str(tag.id)],
            "confidence": 0.95,
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {"input": annotation_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["createAnnotation"]
        assert annotation["imageId"] == str(image.id)
        assert annotation["description"] == "Test annotation"
        assert annotation["version"] == 1
        assert annotation["id"] is not None

    async def test_create_annotation_minimal(self, test_client: TestClient, mock_dependencies):
        """Test creating annotation with minimal required fields."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        annotation_input = {
            "imageId": str(image.id),
            "boundingBox": {"x": 0.0, "y": 0.0, "width": 50.0, "height": 50.0},
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {"input": annotation_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["createAnnotation"]
        assert annotation["imageId"] == str(image.id)
        assert annotation["version"] == 1

    def test_create_annotation_invalid_image_id(self, test_client: TestClient):
        """Test creating annotation with invalid image ID."""
        annotation_input = {
            "imageId": "invalid-id",
            "boundingBox": {"x": 0.0, "y": 0.0, "width": 50.0, "height": 50.0},
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {"input": annotation_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        # Should return None for invalid image ID (invalid ObjectId)
        assert data["data"]["createAnnotation"] is None

    async def test_update_annotation(self, test_client: TestClient, mock_dependencies):
        """Test updating an existing annotation."""
        # Create test image and annotation
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        annotation_data = create_test_annotation(image_id=image.id, description="Original description")
        created = await mock_dependencies.annotation_repo.create_versioned(annotation_data)

        update_input = {
            "description": "Updated description",
            "confidence": 0.85,
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": str(created.id), "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["updateAnnotation"]
        assert annotation["description"] == "Updated description"
        assert annotation["version"] == 2  # Should create new version

    async def test_update_annotation_bounding_box(self, test_client: TestClient, mock_dependencies):
        """Test updating annotation's bounding box."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        annotation_data = create_test_annotation(image_id=image.id, description="Test")
        created = await mock_dependencies.annotation_repo.create_versioned(annotation_data)

        update_input = {
            "boundingBox": {"x": 50.0, "y": 60.0, "width": 200.0, "height": 100.0},
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": str(created.id), "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["updateAnnotation"]
        assert annotation["version"] == 2

    async def test_update_annotation_no_changes(self, test_client: TestClient, mock_dependencies):
        """Test updating annotation with no changes."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        annotation_data = create_test_annotation(image_id=image.id, description="Test")
        created = await mock_dependencies.annotation_repo.create_versioned(annotation_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": str(created.id), "input": {}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        annotation = data["data"]["updateAnnotation"]
        assert annotation["version"] == 1  # Should not create new version

    def test_update_nonexistent_annotation(self, test_client: TestClient):
        """Test updating non-existent annotation."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": "nonexistent", "input": {"description": "Updated"}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateAnnotation"] is None

    async def test_delete_annotation(self, test_client: TestClient, mock_dependencies):
        """Test soft deleting an annotation."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        annotation_data = create_test_annotation(image_id=image.id, description="To be deleted")
        created = await mock_dependencies.annotation_repo.create_versioned(annotation_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["delete_annotation"],
                "variables": {"id": str(created.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        deleted = data["data"]["deleteAnnotation"]
        assert deleted is not None
        assert deleted["version"] == 2  # Should create delete version

        # Verify the annotation is soft-deleted (still exists but marked as deleted)
        original = await mock_dependencies.annotation_repo.get_by_id(created.id)
        assert original is not None  # Original version still exists

    def test_delete_nonexistent_annotation(self, test_client: TestClient):
        """Test deleting non-existent annotation."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["delete_annotation"],
                "variables": {"id": "nonexistent"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["deleteAnnotation"] is None

    async def test_restore_annotation_version(self, test_client: TestClient, mock_dependencies):
        """Test restoring annotation to a previous version."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        # Create initial annotation
        annotation_data = create_test_annotation(image_id=image.id, description="Version 1")
        created = await mock_dependencies.annotation_repo.create_versioned(annotation_data)

        # Update to version 2
        update_data = AnnotationUpdate(description="Version 2")
        await mock_dependencies.annotation_repo.update_versioned(created.id, update_data)

        # Restore to version 1
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["restore_annotation_version"],
                "variables": {"imageId": str(image.id), "version": 1},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        restored = data["data"]["restoreAnnotationVersion"]
        assert restored is not None
        assert restored["description"] == "Version 1"
        assert restored["version"] == 3  # Should be a new version

    async def test_restore_nonexistent_version(self, test_client: TestClient, mock_dependencies):
        """Test restoring non-existent version."""
        image = await mock_dependencies.image_repo.create(create_test_image("http://test.com/image.jpg"))

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["restore_annotation_version"],
                "variables": {"imageId": str(image.id), "version": 999},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["restoreAnnotationVersion"] is None


class TestAnnotationMutationErrorHandling:
    def test_create_annotation_missing_required_field(self, test_client: TestClient):
        """Test creating annotation with missing required field."""
        annotation_input = {
            "imageId": "test-image-id",
            # Missing boundingBox
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {"input": annotation_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_create_annotation_invalid_bounding_box(self, test_client: TestClient):
        """Test creating annotation with invalid bounding box."""
        annotation_input = {
            "imageId": "test-image-id",
            "boundingBox": {"x": "invalid", "y": 0, "width": 50, "height": 50},
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_annotation"],
                "variables": {"input": annotation_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_update_annotation_invalid_confidence(self, test_client: TestClient):
        """Test updating annotation with invalid confidence value."""
        update_input = {
            "confidence": "not_a_number",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_annotation"],
                "variables": {"id": "test-id", "input": update_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data
