"""Tests for AnnotationRepository with versioning."""

from bson import ObjectId
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.annotation import AnnotationUpdate, BoundingBox
from satin.repositories.annotation import AnnotationRepository
from tests.fixtures.sample_data import create_test_annotation


class TestAnnotationRepositoryVersioning:
    async def test_create_versioned(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()
        annotation_data = create_test_annotation(image_id=image_id, description="Test annotation")

        result = await repo.create_versioned(annotation_data)

        assert result.version == 1
        assert str(result.image_id) == str(image_id)
        assert result.description == "Test annotation"

    async def test_update_versioned(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create initial annotation
        initial = await repo.create_versioned(create_test_annotation(image_id=image_id, description="Initial"))

        # Update annotation
        update_data = AnnotationUpdate(description="Updated")
        updated = await repo.update_versioned(initial.id, update_data)

        assert updated is not None
        assert updated.description == "Updated"

    async def test_soft_delete_versioned(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotation
        created = await repo.create_versioned(create_test_annotation(image_id=image_id, description="To be deleted"))

        # Soft delete
        deleted = await repo.soft_delete_versioned(created.id)

        assert deleted is not None


class TestAnnotationRepositoryQueries:
    async def test_get_latest_version_for_image(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotation
        await repo.create_versioned(create_test_annotation(image_id=image_id, description="test"))

        latest = await repo.get_latest_version_for_image(image_id)

        assert latest is not None
        assert latest.description == "test"

    async def test_get_version_history(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotation
        await repo.create_versioned(create_test_annotation(image_id=image_id, description="v1"))

        history = [ann async for ann in repo.get_version_history(image_id)]

        assert len(history) >= 1

    async def test_find_by_image(self, mock_db: AsyncMongoMockDatabase):
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotation
        await repo.create_versioned(create_test_annotation(image_id=image_id))

        results = [ann async for ann in repo.find_by_image(image_id)]

        assert len(results) >= 1


class TestAnnotationRepositoryMissingMethods:
    """Test previously untested annotation repository methods."""

    async def test_find_by_tags(self, mock_db: AsyncMongoMockDatabase):
        """Test finding annotations by tag IDs."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()
        tag1_id = ObjectId()
        tag2_id = ObjectId()

        # Create annotations with different tags
        annotation1 = create_test_annotation(image_id=image_id, tags=[tag1_id], description="Has tag1")
        annotation2 = create_test_annotation(image_id=image_id, tags=[tag2_id], description="Has tag2")
        annotation3 = create_test_annotation(image_id=image_id, tags=[tag1_id, tag2_id], description="Has both")
        annotation4 = create_test_annotation(image_id=image_id, tags=[], description="Has none")

        await repo.create_versioned(annotation1)
        await repo.create_versioned(annotation2)
        await repo.create_versioned(annotation3)
        await repo.create_versioned(annotation4)

        # Find by tag1
        results_tag1 = [ann async for ann in repo.find_by_tags([tag1_id])]
        descriptions_tag1 = [ann.description for ann in results_tag1]

        assert len(results_tag1) == 2
        assert "Has tag1" in descriptions_tag1
        assert "Has both" in descriptions_tag1

        # Find by both tags
        results_both = [ann async for ann in repo.find_by_tags([tag1_id, tag2_id])]
        assert len(results_both) >= 3  # Should find annotations with either tag

    async def test_find_by_confidence_range(self, mock_db: AsyncMongoMockDatabase):
        """Test finding annotations by confidence score range."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotations with different confidence scores
        confidences = [0.1, 0.3, 0.5, 0.7, 0.9, None]
        for _i, conf in enumerate(confidences):
            annotation = create_test_annotation(image_id=image_id, confidence=conf, description=f"conf_{conf}")
            await repo.create_versioned(annotation)

        # Test range filtering
        results_low = [ann async for ann in repo.find_by_confidence_range(min_confidence=0.2)]
        results_high = [ann async for ann in repo.find_by_confidence_range(max_confidence=0.6)]
        results_mid = [ann async for ann in repo.find_by_confidence_range(0.4, 0.8)]

        # Check low confidence results (>= 0.2)
        low_confidences = [ann.confidence for ann in results_low if ann.confidence is not None]
        assert all(conf >= 0.2 for conf in low_confidences)

        # Check high confidence results (<= 0.6)
        high_confidences = [ann.confidence for ann in results_high if ann.confidence is not None]
        assert all(conf <= 0.6 for conf in high_confidences)

        # Check mid range results (0.4 <= conf <= 0.8)
        mid_confidences = [ann.confidence for ann in results_mid if ann.confidence is not None]
        assert all(0.4 <= conf <= 0.8 for conf in mid_confidences)

    async def test_find_by_source(self, mock_db: AsyncMongoMockDatabase):
        """Test finding annotations by source."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create annotations - they'll have default source "manual"
        manual_annotation = create_test_annotation(image_id=image_id, description="Manual annotation")
        await repo.create_versioned(manual_annotation)

        # Update source in database to simulate ML annotation
        ml_annotation = create_test_annotation(image_id=image_id, description="ML annotation")
        created_ml = await repo.create_versioned(ml_annotation)
        await repo._collection.update_one({"_id": created_ml.id}, {"$set": {"source": "ml"}})

        # Find by source
        manual_results = [ann async for ann in repo.find_by_source("manual")]
        ml_results = [ann async for ann in repo.find_by_source("ml")]

        assert len(manual_results) >= 1
        assert len(ml_results) >= 1

        # Check sources are correct
        for ann in manual_results:
            assert ann.source == "manual"
        for ann in ml_results:
            assert ann.source == "ml"

    async def test_get_annotation_count_by_image(self, mock_db: AsyncMongoMockDatabase):
        """Test counting active annotations for an image."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create multiple annotations with different bounding boxes
        annotations = []
        for i in range(3):
            annotation = create_test_annotation(
                image_id=image_id,
                description=f"annotation_{i}",
                bounding_box=BoundingBox(x=i * 10, y=i * 10, width=100, height=50),
            )
            created = await repo.create_versioned(annotation)
            annotations.append(created)

        # Initial count should be 3
        count = await repo.get_annotation_count_by_image(image_id)
        assert count == 3

        # Soft delete one annotation
        await repo.soft_delete_versioned(annotations[0].id)

        # Count should now be 2
        count_after_delete = await repo.get_annotation_count_by_image(image_id)
        assert count_after_delete == 2

    async def test_restore_version(self, mock_db: AsyncMongoMockDatabase):
        """Test restoring annotation to a specific version."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create initial annotation
        initial = await repo.create_versioned(create_test_annotation(image_id=image_id, description="Version 1"))

        # Update to version 2
        updated = await repo.update_versioned(initial.id, AnnotationUpdate(description="Version 2"))

        # Update to version 3
        await repo.update_versioned(updated.id, AnnotationUpdate(description="Version 3"))

        # Restore to version 1
        restored = await repo.restore_version(image_id, 1)

        assert restored is not None
        assert restored.description == "Version 1"
        assert restored.version == 4  # New version number
        assert restored.image_id == image_id

        # Test restoring non-existent version
        nonexistent = await repo.restore_version(image_id, 999)
        assert nonexistent is None

        # Test restoring for non-existent image
        fake_image_id = ObjectId()
        nonexistent_image = await repo.restore_version(fake_image_id, 1)
        assert nonexistent_image is None

    async def test_get_active_annotations_for_image(self, mock_db: AsyncMongoMockDatabase):
        """Test getting active (non-deleted) annotations for an image."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create multiple annotations with different bounding boxes
        bbox1 = BoundingBox(x=10, y=10, width=100, height=50)
        bbox2 = BoundingBox(x=200, y=200, width=150, height=75)
        bbox3 = BoundingBox(x=400, y=400, width=80, height=60)

        await repo.create_versioned(
            create_test_annotation(image_id=image_id, bounding_box=bbox1, description="Active 1")
        )
        await repo.create_versioned(
            create_test_annotation(image_id=image_id, bounding_box=bbox2, description="Active 2")
        )
        ann3 = await repo.create_versioned(
            create_test_annotation(image_id=image_id, bounding_box=bbox3, description="To be deleted")
        )

        # Soft delete one annotation
        await repo.soft_delete_versioned(ann3.id)

        # Get active annotations
        active = [ann async for ann in repo.get_active_annotations_for_image(image_id)]

        # Should only get non-deleted annotations
        assert len(active) == 2
        descriptions = [ann.description for ann in active]
        assert "Active 1" in descriptions
        assert "Active 2" in descriptions
        assert "To be deleted" not in descriptions


class TestAnnotationRepositoryErrorHandling:
    """Test error handling and edge cases."""

    async def test_operations_with_invalid_ids(self, mock_db: AsyncMongoMockDatabase):
        """Test operations with invalid ObjectIds."""
        repo = AnnotationRepository(mock_db)

        # Test with string that's not a valid ObjectId
        invalid_id = "invalid-object-id"

        # These should handle gracefully and return None/empty results
        assert await repo.update_versioned(invalid_id, AnnotationUpdate(description="test")) is None
        assert await repo.soft_delete_versioned(invalid_id) is None

        # These should return empty iterators
        history = [ann async for ann in repo.get_version_history(invalid_id)]
        assert len(history) == 0

        active = [ann async for ann in repo.get_active_annotations_for_image(invalid_id)]
        assert len(active) == 0

        by_image = [ann async for ann in repo.find_by_image(invalid_id)]
        assert len(by_image) == 0

    async def test_concurrent_version_creation(self, mock_db: AsyncMongoMockDatabase):
        """Test behavior when multiple versions are created concurrently."""
        repo = AnnotationRepository(mock_db)
        image_id = ObjectId()

        # Create base annotation
        base_annotation = create_test_annotation(image_id=image_id, description="Base")
        created = await repo.create_versioned(base_annotation)

        # Simulate concurrent updates by creating multiple update operations
        # Note: This is a simplified test since we can't easily test true concurrency with mock
        update1 = AnnotationUpdate(description="Update 1")
        update2 = AnnotationUpdate(description="Update 2")

        result1 = await repo.update_versioned(created.id, update1)
        result2 = await repo.update_versioned(created.id, update2)

        assert result1 is not None
        assert result2 is not None
        assert result1.version != result2.version  # Should have different versions

        # Both updates should be based on the original version
        assert result1.version > created.version
        assert result2.version > created.version
