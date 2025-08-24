"""Annotation repository with versioning support."""

from collections.abc import AsyncIterator
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from satin.models.annotation import Annotation, AnnotationCreate, AnnotationUpdate, ChangeType
from satin.models.base import PyObjectId

from .base import BaseRepository


class AnnotationRepository(BaseRepository[Annotation, AnnotationCreate, AnnotationUpdate]):
    """Repository for Annotation operations with versioning support."""

    def __init__(self, database: AsyncDatabase):
        """Initialize Annotation repository."""
        super().__init__(database, "annotations", Annotation)

    async def create_versioned(
        self, obj_in: AnnotationCreate, change_type: ChangeType = ChangeType.CREATE
    ) -> Annotation:
        """Create a new annotation with versioning."""
        # Get next version number for this image
        latest = await self.get_latest_version_for_image(obj_in.image_id)
        next_version = (latest.version + 1) if latest else 1

        # Create annotation with version
        obj_data = obj_in.model_dump(mode="json")
        obj_data["version"] = next_version

        # Store change metadata
        obj_data["change_type"] = change_type

        return await self.create(AnnotationCreate(**obj_data))

    async def update_versioned(self, annotation_id: PyObjectId | str, obj_in: AnnotationUpdate) -> Annotation | None:
        """Update annotation by creating new version."""
        # Get current annotation
        current = await self.get_by_id(annotation_id)
        if not current:
            return None

        # Create new version with updated data
        updated_data = current.model_dump(exclude={"id", "created_at", "updated_at"})

        # Only update fields that are explicitly set (not None)
        update_dict = obj_in.model_dump(exclude_unset=True, exclude_none=True)
        updated_data.update(update_dict)

        # Get next version number for this image (not just current annotation + 1)
        latest = await self.get_latest_version_for_image(current.image_id)
        next_version = (latest.version + 1) if latest else 1

        updated_data["version"] = next_version
        updated_data["change_type"] = ChangeType.UPDATE

        return await self.create(AnnotationCreate(**updated_data))

    async def soft_delete_versioned(self, annotation_id: PyObjectId | str) -> Annotation | None:
        """Soft delete annotation by creating delete version."""
        current = await self.get_by_id(annotation_id)
        if not current:
            return None

        # Create delete version
        delete_data = current.model_dump(exclude={"id", "created_at", "updated_at"})

        # Get next version number for this image (not just current annotation + 1)
        latest = await self.get_latest_version_for_image(current.image_id)
        next_version = (latest.version + 1) if latest else 1

        delete_data["version"] = next_version
        delete_data["change_type"] = ChangeType.DELETE

        return await self.create(AnnotationCreate(**delete_data))

    async def get_latest_version_for_image(self, image_id: PyObjectId | str) -> Annotation | None:
        """Get the latest version annotation for an image."""
        filter_dict = {"image_id": str(image_id), "change_type": {"$ne": "delete"}}

        cursor = self._collection.find(filter_dict).sort("version", DESCENDING).limit(1)
        async for document in cursor:
            return self._model_class(**document)
        return None

    async def get_version_history(self, image_id: PyObjectId | str) -> AsyncIterator[Annotation]:
        """Get all versions for an annotation on an image."""
        filter_dict = {"image_id": str(image_id)}
        sort = [("version", DESCENDING)]

        async for annotation in self.find_paginated(filter_dict, sort=sort):
            yield annotation

    async def get_active_annotations_for_image(self, image_id: PyObjectId | str) -> AsyncIterator[Annotation]:
        """Get all active (non-deleted) annotations for an image."""
        # Get latest versions grouped by annotation lineage
        pipeline: list[dict[str, Any]] = [
            {"$match": {"image_id": str(image_id)}},
            {"$sort": {"version": -1}},
            {
                "$group": {
                    "_id": {"image_id": "$image_id", "bounding_box": "$bounding_box"},
                    "latest": {"$first": "$$ROOT"},
                }
            },
            {"$replaceRoot": {"newRoot": "$latest"}},
            {"$match": {"change_type": {"$ne": "delete"}}},
        ]

        cursor = await self._aggregate_cursor(pipeline)
        async for document in cursor:
            yield self._model_class(**document)

    async def find_by_image(self, image_id: PyObjectId | str) -> AsyncIterator[Annotation]:
        """Find all annotations for an image (all versions)."""
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
        """Count active annotations for an image."""
        # Count latest non-deleted versions
        pipeline: list[dict[str, Any]] = [
            {"$match": {"image_id": str(image_id)}},
            {"$sort": {"version": -1}},
            {
                "$group": {
                    "_id": {"image_id": "$image_id", "bounding_box": "$bounding_box"},
                    "latest": {"$first": "$$ROOT"},
                }
            },
            {"$match": {"latest.change_type": {"$ne": "delete"}}},
            {"$count": "total"},
        ]

        cursor = await self._aggregate_cursor(pipeline)
        async for result in cursor:
            return int(result["total"])
        return 0

    async def restore_version(self, image_id: PyObjectId | str, target_version: int) -> Annotation | None:
        """Restore annotation to a specific version."""
        # Find the target version
        target = await self.find_one({"image_id": str(image_id), "version": target_version})

        if not target:
            return None

        # Create new version based on target
        restore_data = target.model_dump(exclude={"id", "created_at", "updated_at"})

        # Get next version number
        latest = await self.get_latest_version_for_image(image_id)
        next_version = (latest.version + 1) if latest else 1

        restore_data["version"] = next_version
        restore_data["change_type"] = ChangeType.UPDATE

        return await self.create(AnnotationCreate(**restore_data))
