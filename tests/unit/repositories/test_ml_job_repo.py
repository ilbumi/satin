"""Tests for MLJobRepository with ML-specific functionality."""

import pytest
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.ml_job import MLJobStatus
from satin.repositories.ml_job import MLJobRepository
from tests.fixtures.sample_data import create_test_ml_job


class TestMLJobRepositoryBasicOperations:
    async def test_create_ml_job(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)
        job_data = create_test_ml_job("https://example.com/image.jpg", "ml-service")

        result = await repo.create(job_data)

        assert str(result.image_url) == "https://example.com/image.jpg"
        assert result.endpoint == "ml-service"
        assert result.status == MLJobStatus.PENDING
        assert result.predictions == []

    async def test_update_status(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)
        job = await repo.create(create_test_ml_job())

        updated = await repo.update_status(str(job.id), MLJobStatus.RUNNING)

        assert updated.status == MLJobStatus.RUNNING


class TestMLJobRepositoryQueries:
    @pytest.mark.parametrize(
        ("status", "finder_method"),
        [
            (MLJobStatus.PENDING, "find_pending_jobs"),
            (MLJobStatus.RUNNING, "find_running_jobs"),
            (MLJobStatus.COMPLETED, "find_completed_jobs"),
            (MLJobStatus.FAILED, "find_failed_jobs"),
        ],
    )
    async def test_find_by_status(self, mock_db: AsyncMongoMockDatabase, status, finder_method):
        repo = MLJobRepository(mock_db)

        # Create job with specific status
        job = await repo.create(create_test_ml_job())
        if status != MLJobStatus.PENDING:
            await repo.update_status(str(job.id), status)

        finder = getattr(repo, finder_method)
        results = [job async for job in finder()]

        assert len(results) == 1
        assert results[0].status == status

    async def test_find_by_image_url(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)
        test_url = "https://test.com/specific.jpg"

        await repo.create(create_test_ml_job(test_url))
        await repo.create(create_test_ml_job("https://other.com/image.jpg"))

        results = [job async for job in repo.find_by_image_url(test_url)]

        assert len(results) == 1
        assert str(results[0].image_url) == test_url

    async def test_count_by_status(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)

        # Create pending job
        await repo.create(create_test_ml_job())

        count = await repo.count_by_status(MLJobStatus.PENDING)

        assert count == 1


class TestMLJobRepositoryBulkOperations:
    async def test_cleanup_old_jobs(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)

        # Create job
        job = await repo.create(create_test_ml_job())

        # Test cleanup with recent job (should not delete)
        deleted_count = await repo.cleanup_old_jobs(days=7)

        assert deleted_count == 0

        # Verify job still exists
        still_exists = await repo.get_by_id(job.id)
        assert still_exists is not None

    async def test_get_status_counts(self, mock_db: AsyncMongoMockDatabase):
        repo = MLJobRepository(mock_db)

        # Create jobs with different statuses
        await repo.create(create_test_ml_job())  # PENDING

        running_job = await repo.create(create_test_ml_job())
        await repo.update_status(str(running_job.id), MLJobStatus.RUNNING)

        stats = await repo.get_status_counts()

        assert stats["pending"] == 1
        assert stats["running"] == 1
        assert stats["completed"] == 0
        assert stats["failed"] == 0
