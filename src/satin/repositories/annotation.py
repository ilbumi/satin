"""Annotation repository."""

from collections.abc import AsyncIterator
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from satin.models.annotation import Annotation, AnnotationCreate, AnnotationUpdate
from satin.models.base import PyObjectId

from .base import BaseRepository


class AnnotationRepository(BaseRepository[Annotation, AnnotationCreate, AnnotationUpdate]):
    """Repository for Annotation operations."""

    def __init__(self, database: AsyncDatabase):
        """Initialize Annotation repository."""
        super().__init__(database, "annotations", Annotation)

    async def find_by_image(self, image_id: PyObjectId | str) -> AsyncIterator[Annotation]:
        """Find all annotations for an image."""
        filter_dict = {"image_id": str(image_id)}
        async for annotation in self.find(filter_dict):
            yield annotation

    async def find_by_tags(self, tag_ids: list[PyObjectId | str]) -> AsyncIterator[Annotation]:
        """Find annotations containing any of the specified tags."""
        tag_strings = [str(tag_id) for tag_id in tag_ids]
        filter_dict = {"tags": {"$in": tag_strings}}
        async for annotation in self.find(filter_dict):
            yield annotation

    async def find_by_confidence_range(
        self, min_confidence: float | None = None, max_confidence: float | None = None
    ) -> AsyncIterator[Annotation]:
        """Find annotations by confidence score range."""
        filter_dict: dict[str, Any] = {"confidence": {"$exists": True, "$ne": None}}

        if min_confidence is not None:
            filter_dict["confidence"]["$gte"] = min_confidence
        if max_confidence is not None:
            filter_dict["confidence"]["$lte"] = max_confidence

        async for annotation in self.find(filter_dict):
            yield annotation

    async def find_by_source(self, source: str) -> AsyncIterator[Annotation]:
        """Find annotations by source (manual, ml, etc.)."""
        filter_dict = {"source": source}
        async for annotation in self.find(filter_dict):
            yield annotation

    async def get_annotation_count_by_image(self, image_id: PyObjectId | str) -> int:
        """Count annotations for an image."""
        return await self._collection.count_documents({"image_id": str(image_id)})
