"""ML job repository with domain-specific methods."""

import asyncio
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from satin.models.annotation import AnnotationCreate
from satin.models.ml_job import MLJob, MLJobCreate, MLJobStatus, MLJobUpdate

from .base import BaseRepository


class MLJobRepository(BaseRepository[MLJob, MLJobCreate, MLJobUpdate]):
    """Repository for ML job operations with domain-specific methods."""

    def __init__(self, database: AsyncDatabase):
        """Initialize MLJob repository."""
        super().__init__(database, "ml_jobs", MLJob)

    async def find_by_status(self, status: MLJobStatus) -> AsyncIterator[MLJob]:
        """Find ML jobs by status."""
        async for job in self.find({"status": status.value}):
            yield job

    async def find_by_status_paginated(
        self,
        status: MLJobStatus,
        skip: int = 0,
        limit: int = 100,
        sort: list[tuple[str, int]] | None = None,
    ) -> AsyncIterator[MLJob]:
        """Find ML jobs by status with pagination."""
        async for job in self.find_paginated(
            {"status": status.value},
            skip=skip,
            limit=limit,
            sort=sort,
        ):
            yield job

    async def find_pending_jobs(self) -> AsyncIterator[MLJob]:
        """Find all pending ML jobs."""
        async for job in self.find_by_status(MLJobStatus.PENDING):
            yield job

    async def find_running_jobs(self) -> AsyncIterator[MLJob]:
        """Find all currently running ML jobs."""
        async for job in self.find_by_status(MLJobStatus.RUNNING):
            yield job

    async def find_failed_jobs(self) -> AsyncIterator[MLJob]:
        """Find all failed ML jobs."""
        async for job in self.find_by_status(MLJobStatus.FAILED):
            yield job

    async def find_completed_jobs(self) -> AsyncIterator[MLJob]:
        """Find all completed ML jobs."""
        async for job in self.find_by_status(MLJobStatus.COMPLETED):
            yield job

    async def find_by_image_url(self, image_url: str) -> AsyncIterator[MLJob]:
        """Find ML jobs for a specific image URL."""
        async for job in self.find({"image_url": image_url}):
            yield job

    async def find_by_endpoint(self, endpoint: str) -> AsyncIterator[MLJob]:
        """Find ML jobs for a specific endpoint."""
        async for job in self.find({"endpoint": endpoint}):
            yield job

    async def update_status(
        self,
        job_id: str,
        status: MLJobStatus,
        error_message: str | None = None,
    ) -> MLJob | None:
        """Update ML job status and optionally error message."""
        update_data = MLJobUpdate(status=status, error_message=error_message)
        return await self.update_by_id(job_id, update_data)

    async def add_predictions(
        self,
        job_id: str,
        predictions: list[AnnotationCreate],
    ) -> MLJob | None:
        """Add prediction results to an ML job."""
        update_data = MLJobUpdate(predictions=predictions, status=MLJobStatus.COMPLETED)
        return await self.update_by_id(job_id, update_data)

    async def cancel_job(self, job_id: str) -> MLJob | None:
        """Cancel a pending or running ML job."""
        update_data = MLJobUpdate(status=MLJobStatus.CANCELLED)
        return await self.update_by_id(job_id, update_data)

    async def count_by_status(self, status: MLJobStatus) -> int:
        """Count ML jobs by status."""
        return await self.count({"status": status.value})

    async def get_status_counts(self) -> dict[str, int]:
        """Get count of ML jobs by status."""
        pipeline: list[dict[str, dict[str, Any]]] = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]

        status_counts = {}
        res = self._collection.aggregate(pipeline)
        if asyncio.iscoroutine(res):  # for testing
            cursor = await res
        else:
            cursor = res
        async for result in cursor:
            status_counts[result["_id"]] = result["count"]

        # Ensure all statuses are represented
        for status in MLJobStatus:
            if status.value not in status_counts:
                status_counts[status.value] = 0

        return status_counts

    async def cleanup_old_jobs(self, days: int) -> int:
        """Delete completed, failed, or cancelled jobs older than specified days.

        Args:
            days: Number of days to keep jobs

        Returns:
            Number of jobs deleted

        """
        cutoff_date = datetime.now(UTC) - timedelta(days=days)

        filter_dict = {
            "status": {"$in": [MLJobStatus.COMPLETED.value, MLJobStatus.FAILED.value, MLJobStatus.CANCELLED.value]},
            "updated_at": {"$lt": cutoff_date},
        }

        return await self.delete_many(filter_dict)

    async def find_active_jobs(self) -> AsyncIterator[MLJob]:
        """Find all active (pending or running) ML jobs."""
        filter_dict = {"status": {"$in": [MLJobStatus.PENDING.value, MLJobStatus.RUNNING.value]}}
        async for job in self.find(filter_dict):
            yield job

    async def find_jobs_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> AsyncIterator[MLJob]:
        """Find ML jobs created within a date range."""
        filter_dict = {
            "created_at": {
                "$gte": start_date,
                "$lte": end_date,
            }
        }
        async for job in self.find(filter_dict):
            yield job

    async def get_latest_job_for_image(self, image_url: str) -> MLJob | None:
        """Get the most recent ML job for a specific image URL."""
        filter_dict = {"image_url": image_url}
        sort = [("created_at", -1)]

        async for job in self.find_paginated(filter_dict, limit=1, sort=sort):
            return job
        return None
