"""Tests for GraphQL ML job mutations."""

from fastapi.testclient import TestClient

from satin.models.ml_job import MLJobStatus
from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_ml_job


class TestMLJobMutations:
    def test_create_ml_job(self, test_client: TestClient):
        """Test creating a new ML job."""
        ml_job_input = {
            "imageUrl": "https://test.com/image.jpg",
            "endpoint": "yolo-v5-detector",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["createMlJob"]
        assert job["imageUrl"] == "https://test.com/image.jpg"
        assert job["endpoint"] == "yolo-v5-detector"
        assert job["status"] == "pending"  # Should default to PENDING
        assert job["id"] is not None

    def test_create_ml_job_with_https_url(self, test_client: TestClient):
        """Test creating ML job with HTTPS URL."""
        ml_job_input = {
            "imageUrl": "https://secure.example.com/images/photo.png",
            "endpoint": "detectron2",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["createMlJob"]
        assert job["imageUrl"] == "https://secure.example.com/images/photo.png"
        assert job["endpoint"] == "detectron2"
        assert job["status"] == "pending"

    def test_create_ml_job_with_different_endpoints(self, test_client: TestClient):
        """Test creating ML jobs with different endpoint names."""
        endpoints = ["yolo-v5", "detectron2", "custom-model-v1", "segment-anything"]

        for i, endpoint in enumerate(endpoints):
            ml_job_input = {
                "imageUrl": f"https://test{i}.com/image.jpg",
                "endpoint": endpoint,
            }

            response = test_client.post(
                "/graphql",
                json={
                    "query": GRAPHQL_QUERIES["create_ml_job"],
                    "variables": {"input": ml_job_input},
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            job = data["data"]["createMlJob"]
            assert job["endpoint"] == endpoint

    async def test_update_ml_job_status(self, test_client: TestClient, mock_dependencies):
        """Test updating ML job status."""
        # Create initial ML job
        job_data = create_test_ml_job(
            image_url="https://test.com/image.jpg", endpoint="test-model", status=MLJobStatus.PENDING
        )
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": str(created.id),
                    "status": "running",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["updateMlJobStatus"]
        assert job["status"] == "running"
        assert job["errorMessage"] is None

    async def test_update_ml_job_status_with_error(self, test_client: TestClient, mock_dependencies):
        """Test updating ML job status with error message."""
        job_data = create_test_ml_job(image_url="https://test.com/image.jpg", status=MLJobStatus.RUNNING)
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": str(created.id),
                    "status": "failed",
                    "errorMessage": "Model inference timeout",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["updateMlJobStatus"]
        assert job["status"] == "failed"
        assert job["errorMessage"] == "Model inference timeout"

    async def test_update_ml_job_status_to_completed(self, test_client: TestClient, mock_dependencies):
        """Test updating ML job status to completed."""
        job_data = create_test_ml_job(status=MLJobStatus.RUNNING)
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": str(created.id),
                    "status": "completed",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["updateMlJobStatus"]
        assert job["status"] == "completed"
        assert job["errorMessage"] is None

    def test_update_ml_job_status_invalid_status(self, test_client: TestClient):
        """Test updating ML job with invalid status."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": "test-id",
                    "status": "INVALID_STATUS",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        # Should return None for invalid status
        assert data["data"]["updateMlJobStatus"] is None

    def test_update_nonexistent_ml_job(self, test_client: TestClient):
        """Test updating non-existent ML job."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": "nonexistent-id",
                    "status": "completed",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["updateMlJobStatus"] is None

    async def test_cancel_ml_job(self, test_client: TestClient, mock_dependencies):
        """Test canceling a pending ML job."""
        job_data = create_test_ml_job(image_url="https://test.com/image.jpg", status=MLJobStatus.PENDING)
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["cancel_ml_job"],
                "variables": {"id": str(created.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["cancelMlJob"]
        assert job["status"] == "cancelled"
        assert job["id"] == str(created.id)

    async def test_cancel_running_ml_job(self, test_client: TestClient, mock_dependencies):
        """Test canceling a running ML job."""
        job_data = create_test_ml_job(image_url="https://test.com/image.jpg", status=MLJobStatus.RUNNING)
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["cancel_ml_job"],
                "variables": {"id": str(created.id)},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["cancelMlJob"]
        assert job["status"] == "cancelled"

    def test_cancel_nonexistent_ml_job(self, test_client: TestClient):
        """Test canceling non-existent ML job."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["cancel_ml_job"],
                "variables": {"id": "nonexistent-id"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["cancelMlJob"] is None

    async def test_status_transitions(self, test_client: TestClient, mock_dependencies):
        """Test various status transitions for ML job."""
        # Create a pending job
        job_data = create_test_ml_job(status=MLJobStatus.PENDING)
        created = await mock_dependencies.ml_job_repo.create(job_data)
        job_id = str(created.id)

        # Transition: PENDING -> RUNNING
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {"id": job_id, "status": "running"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["updateMlJobStatus"]["status"] == "running"

        # Transition: RUNNING -> COMPLETED
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {"id": job_id, "status": "completed"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["updateMlJobStatus"]["status"] == "completed"

    async def test_multiple_ml_jobs_same_image(self, test_client: TestClient, mock_dependencies):
        """Test creating multiple ML jobs for the same image."""
        image_url = "https://test.com/shared-image.jpg"

        # Create jobs with different endpoints
        endpoints = ["yolo-v5", "detectron2", "segment-anything"]
        created_jobs = []

        for endpoint in endpoints:
            job_data = create_test_ml_job(image_url=image_url, endpoint=endpoint)
            created = await mock_dependencies.ml_job_repo.create(job_data)
            created_jobs.append(created)

        # Update each job to a different status
        statuses = ["running", "completed", "failed"]

        for job, status in zip(created_jobs, statuses, strict=False):
            response = test_client.post(
                "/graphql",
                json={
                    "query": GRAPHQL_QUERIES["update_ml_job_status"],
                    "variables": {"id": str(job.id), "status": status},
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["updateMlJobStatus"]["status"] == status


class TestMLJobMutationErrorHandling:
    def test_create_ml_job_missing_required_fields(self, test_client: TestClient):
        """Test creating ML job with missing required fields."""
        # Missing imageUrl
        ml_job_input = {"endpoint": "test-model"}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Missing endpoint
        ml_job_input = {"imageUrl": "https://test.com/image.jpg"}

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_create_ml_job_invalid_image_url(self, test_client: TestClient):
        """Test creating ML job with invalid image URL."""
        ml_job_input = {
            "imageUrl": "not-a-valid-url",
            "endpoint": "test-model",
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_create_ml_job_invalid_input_types(self, test_client: TestClient):
        """Test creating ML job with invalid input types."""
        ml_job_input = {
            "imageUrl": 123,  # Should be string
            "endpoint": ["not", "a", "string"],  # Should be string
        }

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["create_ml_job"],
                "variables": {"input": ml_job_input},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_update_ml_job_status_missing_required_fields(self, test_client: TestClient):
        """Test updating ML job status with missing required fields."""
        # Missing id
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {"status": "completed"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Missing status
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {"id": "test-id"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_update_ml_job_status_invalid_types(self, test_client: TestClient):
        """Test updating ML job status with invalid types."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": 123,  # Should be string
                    "status": "completed",
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": "test-id",
                    "status": 123,  # Should be string
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_cancel_ml_job_missing_id(self, test_client: TestClient):
        """Test canceling ML job without providing ID."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["cancel_ml_job"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_cancel_ml_job_invalid_id_type(self, test_client: TestClient):
        """Test canceling ML job with invalid ID type."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["cancel_ml_job"],
                "variables": {"id": 123},  # Should be string
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_input_parameter(self, test_client: TestClient):
        """Test create ML job mutation without input parameter."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["create_ml_job"]})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_null_error_message_parameter(self, test_client: TestClient):
        """Test update ML job status with null error message (should be allowed)."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["update_ml_job_status"],
                "variables": {
                    "id": "test-id",
                    "status": "failed",
                    "errorMessage": None,
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        # This should not cause a GraphQL error since errorMessage is optional
        # The actual error would be from the non-existent ID
        assert "data" in data
        assert data["data"]["updateMlJobStatus"] is None
