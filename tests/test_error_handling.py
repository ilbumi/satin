"""Tests for GraphQL error handling and reporting."""


class TestImageMutations:
    """Test error handling in image mutations."""

    def test_create_image_with_valid_url(self, test_client):
        """Test successful image creation."""
        query = """
        mutation CreateImage($input: ImageCreateInput!) {
            createImage(input: $input) {
                ... on ImageSuccessResult {
                    data {
                        id
                        url
                        status
                    }
                }
                ... on ValidationError {
                    field
                    message
                }
            }
        }
        """

        response = test_client.post(
            "/graphql", json={"query": query, "variables": {"input": {"url": "https://example.com/image.jpg"}}}
        )
        result = response.json()

        assert response.status_code == 200
        assert "data" in result
        assert "data" in result["data"]["createImage"]
        image = result["data"]["createImage"]["data"]
        assert image["url"] == "https://example.com/image.jpg"
        assert image["status"] == "NEW"

    def test_create_image_with_invalid_url(self, test_client):
        """Test image creation with invalid URL."""
        query = """
        mutation CreateImage($input: ImageCreateInput!) {
            createImage(input: $input) {
                ... on ImageSuccessResult {
                    data {
                        id
                        url
                    }
                }
                ... on ValidationError {
                    field
                    message
                }
            }
        }
        """

        response = test_client.post(
            "/graphql", json={"query": query, "variables": {"input": {"url": "not-a-valid-url"}}}
        )
        result = response.json()

        assert response.status_code == 200
        # Should return validation error due to invalid URL
        assert "data" in result
        assert "field" in result["data"]["createImage"]  # ValidationError

    def test_update_nonexistent_image(self, test_client):
        """Test updating an image that doesn't exist."""
        query = """
        mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
            updateImage(id: $id, input: $input) {
                ... on ImageSuccessResult {
                    data {
                        id
                        status
                    }
                }
                ... on NotFoundError {
                    message
                    resource
                }
            }
        }
        """

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "id": "507f1f77bcf86cd799439011",  # Valid but non-existent ObjectId
                    "input": {"status": "ANNOTATED"},
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        assert "data" in result
        # Should return NotFoundError for non-existent resource
        update_result = result["data"]["updateImage"]
        assert "resource" in update_result or "message" in update_result

    def test_update_image_with_invalid_id(self, test_client):
        """Test updating an image with invalid ObjectId."""
        query = """
        mutation UpdateImage($id: String!, $input: ImageUpdateInput!) {
            updateImage(id: $id, input: $input) {
                id
                status
            }
        }
        """

        response = test_client.post(
            "/graphql", json={"query": query, "variables": {"id": "invalid-id", "input": {"status": "ANNOTATED"}}}
        )
        result = response.json()

        assert response.status_code == 200
        # Should have errors due to invalid ObjectId
        assert "errors" in result

    def test_delete_nonexistent_image(self, test_client):
        """Test deleting an image that doesn't exist."""
        query = """
        mutation DeleteImage($id: String!) {
            deleteImage(id: $id) {
                deleted
                message
            }
        }
        """

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {"id": "507f1f77bcf86cd799439011"},  # Valid but non-existent ObjectId
            },
        )
        result = response.json()

        assert response.status_code == 200
        assert "data" in result
        assert result["data"]["deleteImage"]["deleted"] is False
        assert "not found" in result["data"]["deleteImage"]["message"]


class TestAnnotationMutations:
    """Test error handling in annotation mutations."""

    def test_create_annotation_with_invalid_image_id(self, test_client):
        """Test creating annotation with invalid image ID."""
        query = """
        mutation CreateAnnotation($input: AnnotationCreateInput!) {
            createAnnotation(input: $input) {
                id
                imageId
            }
        }
        """

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "input": {
                        "imageId": "invalid-id",
                        "boundingBox": {"x": 10, "y": 20, "width": 100, "height": 200},
                        "tags": ["test"],
                        "description": "Test annotation",
                    }
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        # Should have errors due to invalid ObjectId
        assert "errors" in result

    def test_create_annotation_with_invalid_bounding_box(self, test_client):
        """Test creating annotation with negative bounding box dimensions."""
        query = """
        mutation CreateAnnotation($input: AnnotationCreateInput!) {
            createAnnotation(input: $input) {
                id
                boundingBox {
                    x
                    y
                    width
                    height
                }
            }
        }
        """

        # This should be caught by Pydantic validation
        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "input": {
                        "imageId": "507f1f77bcf86cd799439011",
                        "boundingBox": {
                            "x": -10,  # Negative x
                            "y": 20,
                            "width": -100,  # Negative width
                            "height": 200,
                        },
                        "tags": ["test"],
                    }
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        # Should have errors due to negative values
        assert "errors" in result

    def test_update_annotation_bounding_box(self, test_client, sample_annotation):
        """Test updating annotation bounding box coordinates."""
        query = """
        mutation UpdateAnnotation($id: String!, $input: AnnotationUpdateInput!) {
            updateAnnotation(id: $id, input: $input) {
                __typename
                ... on AnnotationSuccessResult {
                    data {
                        id
                        boundingBox {
                            x
                            y
                            width
                            height
                        }
                    }
                }
                ... on NotFoundError {
                    message
                }
                ... on ValidationError {
                    field
                    message
                }
                ... on OperationError {
                    message
                    details
                }
            }
        }
        """

        # Test with the exact structure that the frontend sends
        new_bbox = {"x": 50.5, "y": 75.3, "width": 150.0, "height": 200.0}

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "id": str(sample_annotation.id),
                    "input": {"boundingBox": new_bbox},
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        assert "data" in result, f"Response: {result}"
        assert result["data"]["updateAnnotation"]["__typename"] == "AnnotationSuccessResult"

        updated_bbox = result["data"]["updateAnnotation"]["data"]["boundingBox"]
        assert updated_bbox["x"] == new_bbox["x"]
        assert updated_bbox["y"] == new_bbox["y"]
        assert updated_bbox["width"] == new_bbox["width"]
        assert updated_bbox["height"] == new_bbox["height"]


class TestMLJobMutations:
    """Test error handling in ML job mutations."""

    def test_create_ml_job_with_invalid_url(self, test_client):
        """Test creating ML job with invalid image URL."""
        query = """
        mutation CreateMLJob($input: MLJobCreateInput!) {
            createMlJob(input: $input) {
                id
                imageUrl
                status
            }
        }
        """

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "input": {
                        "imageUrl": "not-a-valid-url",
                        "endpoint": "test-endpoint",
                    }
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        # Should have errors due to invalid URL
        assert "errors" in result

    def test_update_ml_job_with_invalid_status(self, test_client):
        """Test updating ML job with invalid status."""
        query = """
        mutation UpdateMLJobStatus($id: String!, $status: String!) {
            updateMlJobStatus(id: $id, status: $status) {
                id
                status
            }
        }
        """

        response = test_client.post(
            "/graphql",
            json={
                "query": query,
                "variables": {
                    "id": "507f1f77bcf86cd799439011",
                    "status": "INVALID_STATUS",
                },
            },
        )
        result = response.json()

        assert response.status_code == 200
        # Should have errors due to invalid status
        assert "errors" in result
