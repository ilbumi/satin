"""Tests for AnnotationRepository with versioning."""

import pytest
from bson import ObjectId
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.annotation import AnnotationCreate, AnnotationUpdate, BoundingBox
from satin.repositories.annotation import AnnotationRepository


@pytest.fixture
def sample_bbox() -> BoundingBox:
    """Sample bounding box for testing."""
    return BoundingBox(x=10.0, y=20.0, width=100.0, height=50.0)


class TestAnnotationRepository:
    """Test AnnotationRepository versioning functionality."""

    async def test_create_versioned(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test creating versioned annotation."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        annotation_data = AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, description="Test annotation")

        result = await repo.create_versioned(annotation_data)

        assert result.version == 1
        assert str(result.image_id) == str(image_id)
        assert result.description == "Test annotation"

    async def test_update_versioned(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test updating annotation creates new version."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create initial annotation
        initial = await repo.create_versioned(
            AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, description="Initial")
        )

        # Update annotation
        update_data = AnnotationUpdate(description="Updated")
        updated = await repo.update_versioned(initial.id, update_data)

        assert updated is not None
        assert updated.description == "Updated"

    async def test_soft_delete_versioned(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test soft delete creates delete version."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotation
        annotation = await repo.create_versioned(AnnotationCreate(image_id=image_id, bounding_box=sample_bbox))

        # Soft delete
        deleted = await repo.soft_delete_versioned(annotation.id)

        assert deleted is not None

    async def test_get_latest_version_for_image(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test getting latest version for image."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create multiple versions
        v1 = await repo.create_versioned(
            AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, description="Version 1")
        )

        await repo.update_versioned(v1.id, AnnotationUpdate(description="Version 2"))

        latest = await repo.get_latest_version_for_image(image_id)

        assert latest is not None
        assert latest.description in ["Version 1", "Version 2"]

    async def test_get_version_history(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test getting version history."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create multiple versions
        v1 = await repo.create_versioned(
            AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, description="V1")
        )

        await repo.update_versioned(v1.id, AnnotationUpdate(description="V2"))

        history = [ann async for ann in repo.get_version_history(image_id)]

        assert len(history) >= 2
        # Should be sorted by version descending
        assert history[0].version >= history[1].version

    async def test_find_by_confidence_range(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test finding annotations by confidence range."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotations with different confidence scores
        await repo.create_versioned(AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, confidence=0.8))

        await repo.create_versioned(AnnotationCreate(image_id=ObjectId(), bounding_box=sample_bbox, confidence=0.6))

        results = [ann async for ann in repo.find_by_confidence_range(min_confidence=0.7)]

        assert len(results) == 1
        assert results[0].confidence == 0.8

    async def test_find_by_source(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test finding annotations by source."""
        repo = AnnotationRepository(mock_db)

        await repo.create_versioned(AnnotationCreate(image_id=ObjectId(), bounding_box=sample_bbox))

        results = [ann async for ann in repo.find_by_source("manual")]

        assert len(results) >= 1

    async def test_restore_version(self, mock_db: AsyncMongoMockDatabase, sample_bbox: BoundingBox):
        """Test restoring to previous version."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create versions
        v1 = await repo.create_versioned(
            AnnotationCreate(image_id=image_id, bounding_box=sample_bbox, description="Original")
        )

        await repo.update_versioned(v1.id, AnnotationUpdate(description="Modified"))

        # Restore to version 1
        restored = await repo.restore_version(image_id, 1)

        assert restored is not None
        assert restored.description == "Original"
