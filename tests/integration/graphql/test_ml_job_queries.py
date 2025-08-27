"""Tests for GraphQL ML job queries."""

from bson import ObjectId
from fastapi.testclient import TestClient

from satin.models.annotation import AnnotationCreate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.ml_job import MLJobStatus, MLJobUpdate
from tests.fixtures.sample_data import GRAPHQL_QUERIES, create_test_ml_job


class TestMLJobQueries:
    def test_query_ml_jobs_empty(self, test_client: TestClient):
        """Test querying ML jobs when none exist."""
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_ml_jobs"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["mlJobs"] == []

    async def test_query_ml_jobs_with_data(self, test_client: TestClient, mock_dependencies):
        """Test querying ML jobs with sample data."""
        # Create test ML jobs
        job1 = create_test_ml_job(
            image_url="https://test1.com/image.jpg", endpoint="yolo-v5", status=MLJobStatus.PENDING
        )
        job2 = create_test_ml_job(
            image_url="https://test2.com/image.png", endpoint="detectron2", status=MLJobStatus.COMPLETED
        )

        await mock_dependencies.ml_job_repo.create(job1)
        await mock_dependencies.ml_job_repo.create(job2)

        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["list_ml_jobs"]})

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]["mlJobs"]) == 2

        # Check that ML jobs have correct properties
        job_data = data["data"]["mlJobs"][0]
        assert "id" in job_data
        assert "imageUrl" in job_data
        assert "endpoint" in job_data
        assert "status" in job_data
        assert job_data["status"] in ["pending", "completed"]

    async def test_query_ml_job_by_id(self, test_client: TestClient, mock_dependencies):
        """Test querying a single ML job by ID."""
        job_data = create_test_ml_job(
            image_url="https://test.com/image.jpg", endpoint="test-model", status=MLJobStatus.RUNNING
        )
        created = await mock_dependencies.ml_job_repo.create(job_data)

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_ml_job"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["mlJob"]
        assert job["imageUrl"] == "https://test.com/image.jpg"
        assert job["endpoint"] == "test-model"
        assert job["status"] == "running"
        assert job["predictions"] == []  # Should be empty list initially

    def test_query_ml_job_not_found(self, test_client: TestClient):
        """Test querying a non-existent ML job."""
        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_ml_job"], "variables": {"id": "nonexistent"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["mlJob"] is None

    async def test_query_ml_jobs_by_status(self, test_client: TestClient, mock_dependencies):
        """Test querying ML jobs by status."""
        # Create jobs with different statuses
        pending_job = create_test_ml_job(image_url="https://pending.com/image.jpg", status=MLJobStatus.PENDING)
        completed_job = create_test_ml_job(image_url="https://completed.com/image.jpg", status=MLJobStatus.COMPLETED)
        failed_job = create_test_ml_job(image_url="https://failed.com/image.jpg", status=MLJobStatus.FAILED)

        await mock_dependencies.ml_job_repo.create(pending_job)
        await mock_dependencies.ml_job_repo.create(completed_job)
        await mock_dependencies.ml_job_repo.create(failed_job)

        # Query for pending jobs
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                "variables": {"status": "pending"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByStatus"]
        assert len(jobs) == 1
        assert jobs[0]["status"] == "pending"
        assert jobs[0]["imageUrl"] == "https://pending.com/image.jpg"

        # Query for completed jobs
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                "variables": {"status": "completed"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByStatus"]
        assert len(jobs) == 1
        assert jobs[0]["status"] == "completed"

    def test_query_ml_jobs_by_invalid_status(self, test_client: TestClient):
        """Test querying ML jobs with invalid status."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                "variables": {"status": "INVALID_STATUS"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByStatus"]
        assert jobs == []  # Should return empty list for invalid status

    async def test_query_ml_jobs_by_image_url(self, test_client: TestClient, mock_dependencies):
        """Test querying ML jobs by image URL."""
        image_url = "https://test.com/specific-image.jpg"

        # Create jobs for the same image with different endpoints
        job1 = create_test_ml_job(image_url=image_url, endpoint="yolo-v5")
        job2 = create_test_ml_job(image_url=image_url, endpoint="detectron2")
        # Create job for different image
        job3 = create_test_ml_job(image_url="https://other.com/image.jpg", endpoint="yolo-v5")

        await mock_dependencies.ml_job_repo.create(job1)
        await mock_dependencies.ml_job_repo.create(job2)
        await mock_dependencies.ml_job_repo.create(job3)

        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_image_url"],
                "variables": {"imageUrl": image_url},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByImageUrl"]
        assert len(jobs) == 2

        # All returned jobs should have the same image URL
        for job in jobs:
            assert job["imageUrl"] == image_url  # Note: GraphQL returns imageUrl, not image_url

        # Should have both endpoints
        endpoints = [job["endpoint"] for job in jobs]
        assert "yolo-v5" in endpoints
        assert "detectron2" in endpoints

    def test_query_ml_jobs_by_nonexistent_image_url(self, test_client: TestClient):
        """Test querying ML jobs for non-existent image URL."""
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_image_url"],
                "variables": {"imageUrl": "https://nonexistent.com/image.jpg"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByImageUrl"]
        assert jobs == []

    async def test_query_ml_job_with_predictions(self, test_client: TestClient, mock_dependencies):
        """Test querying ML job that has predictions."""
        # Create ML job first
        job_data = create_test_ml_job(
            image_url="https://test.com/image.jpg", endpoint="test-model", status=MLJobStatus.COMPLETED
        )
        created = await mock_dependencies.ml_job_repo.create(job_data)

        # Update the job with predictions
        prediction = AnnotationCreate(
            image_id=PyObjectId(ObjectId()),
            bounding_box=BoundingBox(x=10, y=20, width=100, height=50),
            description="predicted object",
            confidence=0.95,
        )

        update_data = MLJobUpdate(predictions=[prediction])
        created = await mock_dependencies.ml_job_repo.update_by_id(str(created.id), update_data)

        response = test_client.post(
            "/graphql",
            json={"query": GRAPHQL_QUERIES["get_ml_job"], "variables": {"id": str(created.id)}},
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        job = data["data"]["mlJob"]
        assert len(job["predictions"]) == 1
        assert job["predictions"][0]["description"] == "predicted object"

    async def test_query_multiple_ml_job_statuses(self, test_client: TestClient, mock_dependencies):
        """Test that we can query different statuses correctly."""
        statuses_to_test = [
            MLJobStatus.PENDING,
            MLJobStatus.RUNNING,
            MLJobStatus.COMPLETED,
            MLJobStatus.FAILED,
            MLJobStatus.CANCELLED,
        ]

        # Create one job for each status
        for i, status in enumerate(statuses_to_test):
            job_data = create_test_ml_job(
                image_url=f"https://test{i}.com/image.jpg", endpoint="test-endpoint", status=status
            )
            await mock_dependencies.ml_job_repo.create(job_data)

        # Query each status
        for status in statuses_to_test:
            response = test_client.post(
                "/graphql",
                json={
                    "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                    "variables": {"status": status.value},
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            jobs = data["data"]["mlJobsByStatus"]
            assert len(jobs) == 1
            assert jobs[0]["status"] == status.value


class TestMLJobQueryErrorHandling:
    def test_invalid_ml_job_field(self, test_client: TestClient):
        """Test querying with invalid field."""
        invalid_query = """
            query {
                mlJobs {
                    invalidField
                }
            }
        """

        response = test_client.post("/graphql", json={"query": invalid_query})

        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_missing_required_variables(self, test_client: TestClient):
        """Test queries missing required variables."""
        # Test get_ml_job without id
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["get_ml_job"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test ml_jobs_by_status without status
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["ml_jobs_by_status"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test ml_jobs_by_image_url without imageUrl
        response = test_client.post("/graphql", json={"query": GRAPHQL_QUERIES["ml_jobs_by_image_url"]})
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_invalid_variable_types(self, test_client: TestClient):
        """Test queries with invalid variable types."""
        # Test with non-string id
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["get_ml_job"],
                "variables": {"id": 123},  # Should be string
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

        # Test with non-string status
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                "variables": {"status": ["PENDING"]},  # Should be string
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data

    def test_empty_string_variables(self, test_client: TestClient):
        """Test queries with empty string variables."""
        # Test with empty status
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_status"],
                "variables": {"status": ""},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByStatus"]
        assert jobs == []  # Should return empty list

        # Test with empty image URL
        response = test_client.post(
            "/graphql",
            json={
                "query": GRAPHQL_QUERIES["ml_jobs_by_image_url"],
                "variables": {"imageUrl": ""},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        jobs = data["data"]["mlJobsByImageUrl"]
        assert jobs == []
