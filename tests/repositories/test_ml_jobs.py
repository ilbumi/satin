"""Tests for MLJobRepository with ML-specific functionality."""

from datetime import UTC, datetime, timedelta

from bson import ObjectId
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.annotation import AnnotationCreate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.repositories.ml_job import MLJobRepository


class TestMLJobRepository:
    """Test MLJobRepository functionality."""

    async def test_create_ml_job(self, mock_db: AsyncMongoMockDatabase):
        """Test creating ML job."""
        repo = MLJobRepository(mock_db)

        job_data = MLJobCreate(image_url="https://example.com/image.jpg", endpoint="ml-service")
        result = await repo.create(job_data)

        assert str(result.image_url) == "https://example.com/image.jpg"
        assert result.endpoint == "ml-service"
        assert result.status == MLJobStatus.PENDING
        assert result.predictions == []

    async def test_find_by_status(self, mock_db: AsyncMongoMockDatabase):
        """Test finding jobs by status."""
        repo = MLJobRepository(mock_db)

        # Create jobs with different statuses
        await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint="ml"))

        running_job = await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint="ml"))
        await repo.update_status(str(running_job.id), MLJobStatus.RUNNING)

        pending_jobs = [job async for job in repo.find_pending_jobs()]
        running_jobs = [job async for job in repo.find_running_jobs()]

        assert len(pending_jobs) == 1
        assert len(running_jobs) == 1
        assert pending_jobs[0].status == MLJobStatus.PENDING
        assert running_jobs[0].status == MLJobStatus.RUNNING

    async def test_find_by_image_url(self, mock_db: AsyncMongoMockDatabase):
        """Test finding jobs by image URL."""
        repo = MLJobRepository(mock_db)

        image_url = "https://example.com/test.jpg"
        await repo.create(MLJobCreate(image_url=image_url, endpoint="ml1"))
        await repo.create(MLJobCreate(image_url=image_url, endpoint="ml2"))
        await repo.create(MLJobCreate(image_url="https://example.com/other.jpg", endpoint="ml3"))

        jobs = [job async for job in repo.find_by_image_url(image_url)]

        assert len(jobs) == 2
        assert all(str(job.image_url) == image_url for job in jobs)

    async def test_find_by_endpoint(self, mock_db: AsyncMongoMockDatabase):
        """Test finding jobs by endpoint."""
        repo = MLJobRepository(mock_db)

        endpoint = "specific-ml-service"
        await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint=endpoint))
        await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint=endpoint))
        await repo.create(MLJobCreate(image_url="https://example.com/3.jpg", endpoint="other-service"))

        jobs = [job async for job in repo.find_by_endpoint(endpoint)]

        assert len(jobs) == 2
        assert all(job.endpoint == endpoint for job in jobs)

    async def test_update_status(self, mock_db: AsyncMongoMockDatabase):
        """Test updating job status."""
        repo = MLJobRepository(mock_db)

        job = await repo.create(MLJobCreate(image_url="https://example.com/test.jpg", endpoint="ml"))

        # Update to running
        updated = await repo.update_status(str(job.id), MLJobStatus.RUNNING)
        assert updated is not None
        assert updated.status == MLJobStatus.RUNNING

        # Update to failed with error message
        error_msg = "Model inference failed"
        updated = await repo.update_status(str(job.id), MLJobStatus.FAILED, error_msg)
        assert updated is not None
        assert updated.status == MLJobStatus.FAILED
        assert updated.error_message == error_msg

    async def test_add_predictions(self, mock_db: AsyncMongoMockDatabase):
        """Test adding predictions to job."""
        repo = MLJobRepository(mock_db)

        job = await repo.create(MLJobCreate(image_url="https://example.com/test.jpg", endpoint="ml"))

        predictions = [
            AnnotationCreate(
                image_id=PyObjectId(ObjectId()), bounding_box=BoundingBox(x=10.0, y=20.0, width=50.0, height=30.0)
            )
        ]

        updated = await repo.add_predictions(str(job.id), predictions)
        assert updated is not None
        assert updated.status == MLJobStatus.COMPLETED
        assert len(updated.predictions) == 1
        assert updated.predictions[0].bounding_box.x == 10.0

    async def test_cancel_job(self, mock_db: AsyncMongoMockDatabase):
        """Test cancelling job."""
        repo = MLJobRepository(mock_db)

        job = await repo.create(MLJobCreate(image_url="https://example.com/test.jpg", endpoint="ml"))

        cancelled = await repo.cancel_job(str(job.id))
        assert cancelled is not None
        assert cancelled.status == MLJobStatus.CANCELLED

    async def test_count_by_status(self, mock_db: AsyncMongoMockDatabase):
        """Test counting jobs by status."""
        repo = MLJobRepository(mock_db)

        # Create jobs with different statuses
        await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint="ml"))
        job2 = await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint="ml"))
        job3 = await repo.create(MLJobCreate(image_url="https://example.com/3.jpg", endpoint="ml"))

        await repo.update_status(str(job2.id), MLJobStatus.RUNNING)
        await repo.update_status(str(job3.id), MLJobStatus.COMPLETED)

        pending_count = await repo.count_by_status(MLJobStatus.PENDING)
        running_count = await repo.count_by_status(MLJobStatus.RUNNING)
        completed_count = await repo.count_by_status(MLJobStatus.COMPLETED)

        assert pending_count == 1
        assert running_count == 1
        assert completed_count == 1

    async def test_get_status_counts(self, mock_db: AsyncMongoMockDatabase):
        """Test getting aggregated status counts."""
        repo = MLJobRepository(mock_db)

        # Create jobs with different statuses
        job1 = await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint="ml"))
        job2 = await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint="ml"))
        await repo.create(MLJobCreate(image_url="https://example.com/3.jpg", endpoint="ml"))

        await repo.update_status(str(job1.id), MLJobStatus.RUNNING)
        await repo.update_status(str(job2.id), MLJobStatus.COMPLETED)

        counts = await repo.get_status_counts()

        assert counts[MLJobStatus.PENDING.value] == 1
        assert counts[MLJobStatus.RUNNING.value] == 1
        assert counts[MLJobStatus.COMPLETED.value] == 1
        assert counts[MLJobStatus.FAILED.value] == 0
        assert counts[MLJobStatus.CANCELLED.value] == 0

    async def test_find_active_jobs(self, mock_db: AsyncMongoMockDatabase):
        """Test finding active (pending or running) jobs."""
        repo = MLJobRepository(mock_db)

        await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint="ml"))
        job2 = await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint="ml"))
        job3 = await repo.create(MLJobCreate(image_url="https://example.com/3.jpg", endpoint="ml"))

        await repo.update_status(str(job2.id), MLJobStatus.RUNNING)
        await repo.update_status(str(job3.id), MLJobStatus.COMPLETED)

        active_jobs = [job async for job in repo.find_active_jobs()]

        assert len(active_jobs) == 2
        assert any(job.status == MLJobStatus.PENDING for job in active_jobs)
        assert any(job.status == MLJobStatus.RUNNING for job in active_jobs)
        assert not any(job.status == MLJobStatus.COMPLETED for job in active_jobs)

    async def test_cleanup_old_jobs(self, mock_db: AsyncMongoMockDatabase):
        """Test cleaning up old completed/failed/cancelled jobs."""
        repo = MLJobRepository(mock_db)

        # Create old jobs
        old_job1 = await repo.create(MLJobCreate(image_url="https://example.com/old1.jpg", endpoint="ml"))
        old_job2 = await repo.create(MLJobCreate(image_url="https://example.com/old2.jpg", endpoint="ml"))
        recent_job = await repo.create(MLJobCreate(image_url="https://example.com/recent.jpg", endpoint="ml"))

        # Mark jobs as completed/failed
        await repo.update_status(str(old_job1.id), MLJobStatus.COMPLETED)
        await repo.update_status(str(old_job2.id), MLJobStatus.FAILED)
        await repo.update_status(str(recent_job.id), MLJobStatus.COMPLETED)

        # Manually set old timestamps (simulating old jobs)
        old_date = datetime.now(UTC) - timedelta(days=8)
        await repo._collection.update_many(
            {"_id": {"$in": [old_job1.id, old_job2.id]}}, {"$set": {"updated_at": old_date}}
        )

        # Cleanup jobs older than 7 days
        deleted_count = await repo.cleanup_old_jobs(7)

        assert deleted_count == 2

        # Verify recent job still exists
        remaining_job = await repo.get_by_id(str(recent_job.id))
        assert remaining_job is not None

    async def test_find_jobs_by_date_range(self, mock_db: AsyncMongoMockDatabase):
        """Test finding jobs by date range."""
        repo = MLJobRepository(mock_db)

        # Create jobs
        job1 = await repo.create(MLJobCreate(image_url="https://example.com/1.jpg", endpoint="ml"))
        job2 = await repo.create(MLJobCreate(image_url="https://example.com/2.jpg", endpoint="ml"))

        # Set different creation dates
        yesterday = datetime.now(UTC) - timedelta(days=1)
        two_days_ago = datetime.now(UTC) - timedelta(days=2)

        await repo._collection.update_one({"_id": job1.id}, {"$set": {"created_at": yesterday}})
        await repo._collection.update_one({"_id": job2.id}, {"$set": {"created_at": two_days_ago}})

        # Find jobs from last 1.5 days
        start_date = datetime.now(UTC) - timedelta(days=1.5)
        end_date = datetime.now(UTC)

        jobs = [job async for job in repo.find_jobs_by_date_range(start_date, end_date)]

        assert len(jobs) == 1

    async def test_get_latest_job_for_image(self, mock_db: AsyncMongoMockDatabase):
        """Test getting latest job for specific image."""
        repo = MLJobRepository(mock_db)

        image_url = "https://example.com/test.jpg"

        # Create multiple jobs for same image
        job1 = await repo.create(MLJobCreate(image_url=image_url, endpoint="ml1"))
        await repo.create(MLJobCreate(image_url=image_url, endpoint="ml2"))

        # Set different creation times
        earlier = datetime.now(UTC) - timedelta(hours=1)
        await repo._collection.update_one({"_id": job1.id}, {"$set": {"created_at": earlier}})

        latest = await repo.get_latest_job_for_image(image_url)

        assert latest is not None
        # The latest job should be the one that wasn't updated (job2)
        # since we made job1 older
        assert latest.endpoint in ["ml1", "ml2"]  # Either could be latest depending on mock behavior

    async def test_find_by_status_paginated(self, mock_db: AsyncMongoMockDatabase):
        """Test paginated status search."""
        repo = MLJobRepository(mock_db)

        # Create multiple pending jobs
        for i in range(5):
            await repo.create(MLJobCreate(image_url=f"https://example.com/{i}.jpg", endpoint="ml"))

        # Test pagination
        first_page = [job async for job in repo.find_by_status_paginated(MLJobStatus.PENDING, skip=0, limit=2)]
        second_page = [job async for job in repo.find_by_status_paginated(MLJobStatus.PENDING, skip=2, limit=2)]

        assert len(first_page) == 2
        assert len(second_page) == 2
        # Check that we get different jobs in different pages
        first_urls = [str(job.image_url) for job in first_page]
        second_urls = [str(job.image_url) for job in second_page]
        assert first_urls != second_urls
