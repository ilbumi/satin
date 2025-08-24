"""Image repository with domain-specific methods."""

from collections.abc import AsyncIterator
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from satin.models.image import Image, ImageCreate, ImageStatus, ImageUpdate

from .base import BaseRepository


class ImageRepository(BaseRepository[Image, ImageCreate, ImageUpdate]):
    """Repository for Image operations with domain-specific methods."""

    def __init__(self, database: AsyncDatabase):
        """Initialize Image repository."""
        super().__init__(database, "images", Image)

    async def find_by_status(self, status: ImageStatus) -> AsyncIterator[Image]:
        """Find images by status."""
        async for image in self.find({"status": status.value}):
            yield image

    async def find_by_status_paginated(
        self,
        status: ImageStatus,
        skip: int = 0,
        limit: int = 100,
        sort: list[tuple[str, int]] | None = None,
    ) -> AsyncIterator[Image]:
        """Find images by status with pagination."""
        async for image in self.find_paginated(
            {"status": status.value},
            skip=skip,
            limit=limit,
            sort=sort,
        ):
            yield image

    async def find_new_images(self) -> AsyncIterator[Image]:
        """Find all new (unannotated) images."""
        async for image in self.find_by_status(ImageStatus.NEW):
            yield image

    async def find_annotated_images(self) -> AsyncIterator[Image]:
        """Find all annotated images."""
        async for image in self.find_by_status(ImageStatus.ANNOTATED):
            yield image

    async def find_images_needing_reannotation(self) -> AsyncIterator[Image]:
        """Find images that need re-annotation."""
        async for image in self.find_by_status(ImageStatus.NEEDS_REANNOTATION):
            yield image

    async def count_by_status(self, status: ImageStatus) -> int:
        """Count images by status."""
        return await self.count({"status": status.value})

    async def get_status_counts(self) -> dict[str, int]:
        """Get count of images by status."""
        pipeline: list[dict[str, dict[str, Any]]] = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]

        status_counts = {}
        cursor = await self._aggregate_cursor(pipeline)
        async for result in cursor:
            # aggregate returns dict-like objects, not Image models
            status_counts[result["_id"]] = result["count"]

        # Ensure all statuses are represented
        for status in ImageStatus:
            if status.value not in status_counts:
                status_counts[status.value] = 0

        return status_counts

    async def find_by_dimensions(
        self,
        min_width: int | None = None,
        max_width: int | None = None,
        min_height: int | None = None,
        max_height: int | None = None,
    ) -> AsyncIterator[Image]:
        """Find images by dimension constraints."""
        filter_dict: dict[str, Any] = {}

        if min_width is not None:
            filter_dict["width"] = {"$gte": min_width}
        if max_width is not None:
            if "width" in filter_dict:
                filter_dict["width"]["$lte"] = max_width
            else:
                filter_dict["width"] = {"$lte": max_width}

        if min_height is not None:
            filter_dict["height"] = {"$gte": min_height}
        if max_height is not None:
            if "height" in filter_dict:
                filter_dict["height"]["$lte"] = max_height
            else:
                filter_dict["height"] = {"$lte": max_height}

        async for image in self.find(filter_dict):
            yield image

    async def mark_as_annotated(self, image_id: str) -> Image | None:
        """Mark an image as annotated."""
        update_data = ImageUpdate(status=ImageStatus.ANNOTATED)
        return await self.update_by_id(image_id, update_data)
