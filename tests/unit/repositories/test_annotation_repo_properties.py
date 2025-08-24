"""Property-based tests for AnnotationRepository."""

import math

from bson import ObjectId
from hypothesis import given, settings
from hypothesis import strategies as st
from mongomock_motor import AsyncMongoMockClient

from satin.models.annotation import AnnotationUpdate, ChangeType
from satin.repositories.annotation import AnnotationRepository
from tests.strategies import (
    annotation_creates,
    bounding_boxes,
    confidence_scores,
    dangerous_strings,
    invalid_confidence_scores,
    py_object_ids,
    safe_strings,
)


class TestAnnotationRepositoryProperties:
    """Property-based tests for annotation repository."""

    async def _get_repo(self):
        """Create repository with fresh mock database."""
        client = AsyncMongoMockClient()
        db = client.test_db
        repo = AnnotationRepository(db)
        return repo, client

    @given(annotation_creates())
    @settings(max_examples=20)
    async def test_create_versioned_properties(self, annotation_data):
        """Test properties of versioned annotation creation."""
        repo, client = await self._get_repo()

        try:
            result = await repo.create_versioned(annotation_data)

            # Properties that must hold
            assert result.image_id == annotation_data.image_id
            assert result.description == annotation_data.description
            assert result.version >= 1
            assert result.source == "manual"  # Default source
            assert result.change_type == ChangeType.CREATE
            assert result.id is not None
            assert result.created_at is not None
            assert result.updated_at is not None
        finally:
            client.close()

    @given(py_object_ids(), st.lists(annotation_creates(), min_size=2, max_size=5))
    @settings(max_examples=10)
    async def test_version_incrementing_property(self, image_id, annotations):
        """Test that versions always increment properly."""
        repo, client = await self._get_repo()

        try:
            # Set all annotations to same image_id
            for ann in annotations:
                ann.image_id = image_id

            created_annotations = []
            for annotation_data in annotations:
                result = await repo.create_versioned(annotation_data)
                created_annotations.append(result)

            # Check version progression
            versions = [ann.version for ann in created_annotations]
            assert versions == list(range(1, len(annotations) + 1))

            # Check latest version is correct
            latest = await repo.get_latest_version_for_image(image_id)
            assert latest is not None
            assert latest.version == max(versions)
        finally:
            client.close()

    @given(annotation_creates())
    @settings(max_examples=15)
    async def test_update_versioned_creates_new_version(self, annotation_data):
        """Test that updates create new versions with incremented version numbers."""
        repo, client = await self._get_repo()

        try:
            # Create initial annotation
            initial = await repo.create_versioned(annotation_data)

            # Update with new data
            update_data = AnnotationUpdate(description="Updated description", confidence=0.95)
            updated = await repo.update_versioned(initial.id, update_data)

            # Properties that must hold
            assert updated is not None
            assert updated.version == initial.version + 1
            assert updated.image_id == initial.image_id
            assert updated.description == "Updated description"
            assert updated.confidence == 0.95
            assert updated.change_type == ChangeType.UPDATE

            # Original annotation should still exist
            original = await repo.get_by_id(initial.id)
            assert original is not None
        finally:
            client.close()

    @given(annotation_creates())
    @settings(max_examples=15)
    async def test_soft_delete_creates_delete_version(self, annotation_data):
        """Test that soft delete creates a new version with DELETE change type."""
        repo, client = await self._get_repo()

        try:
            # Create annotation
            created = await repo.create_versioned(annotation_data)

            # Soft delete
            deleted = await repo.soft_delete_versioned(created.id)

            # Properties that must hold
            assert deleted is not None
            assert deleted.version == created.version + 1
            assert deleted.image_id == created.image_id
            assert deleted.change_type == ChangeType.DELETE

            # Original annotation should still exist
            original = await repo.get_by_id(created.id)
            assert original is not None
        finally:
            client.close()

    @given(
        py_object_ids(),
        st.lists(bounding_boxes(), min_size=1, max_size=5),
        st.lists(safe_strings(min_size=1, max_size=100), min_size=1, max_size=5),
        st.data(),
    )
    @settings(max_examples=10)
    async def test_active_annotations_exclude_deleted(self, image_id, bbox_list, descriptions, data):
        """Test that active annotations query excludes soft-deleted annotations."""
        repo, client = await self._get_repo()

        try:
            created_annotations = []
            # Create annotations with different bounding boxes
            for bbox, desc in zip(bbox_list, descriptions, strict=False):
                annotation_data = data.draw(annotation_creates())
                annotation_data.image_id = image_id
                annotation_data.bounding_box = bbox
                annotation_data.description = desc

                created = await repo.create_versioned(annotation_data)
                created_annotations.append(created)

            # Soft delete some annotations
            deleted_count = len(created_annotations) // 2
            for i in range(deleted_count):
                await repo.soft_delete_versioned(created_annotations[i].id)

            # Get active annotations
            active = [ann async for ann in repo.get_active_annotations_for_image(image_id)]

            # Should only include non-deleted annotations
            assert len(active) == len(created_annotations) - deleted_count

            # None of the active annotations should have DELETE change_type
            for ann in active:
                assert ann.change_type != ChangeType.DELETE
        finally:
            client.close()

    @given(confidence_scores(), st.data())
    @settings(max_examples=10)
    async def test_confidence_range_filtering(self, target_confidence, data):
        """Test confidence range filtering works correctly."""
        repo, client = await self._get_repo()

        try:
            # Create annotations with various confidence scores
            confidences = [0.1, 0.3, 0.5, 0.7, 0.9, target_confidence]

            for conf in confidences:
                annotation_data = data.draw(annotation_creates())
                annotation_data.confidence = conf
                await repo.create_versioned(annotation_data)

            # Test range filtering
            min_conf = target_confidence - 0.1
            max_conf = target_confidence + 0.1

            results = [ann async for ann in repo.find_by_confidence_range(min_conf, max_conf)]

            # All results should be within range
            for ann in results:
                assert ann.confidence is not None
                assert min_conf <= ann.confidence <= max_conf
        finally:
            client.close()

    @given(st.lists(safe_strings(min_size=1, max_size=20), min_size=1, max_size=5), st.data())
    @settings(max_examples=10)
    async def test_source_filtering(self, sources, data):
        """Test source filtering works correctly."""
        repo, client = await self._get_repo()

        try:
            # Create annotations with different sources
            created_by_source = {}
            for source in sources:
                annotation_data = data.draw(annotation_creates())
                created = await repo.create_versioned(annotation_data)

                # Update source in database directly since model sets default
                await repo._collection.update_one({"_id": created.id}, {"$set": {"source": source}})
                created_by_source[source] = created

            # Test filtering by each source
            for source in sources:
                results = [ann async for ann in repo.find_by_source(source)]

                # Should find at least one annotation with this source
                assert len(results) >= 1

                # All results should have the correct source
                for ann in results:
                    assert ann.source == source
        finally:
            client.close()


class TestAnnotationRepositoryEdgeCases:
    """Edge case testing for annotation repository."""

    async def _get_repo(self):
        """Create repository with fresh mock database."""
        client = AsyncMongoMockClient()
        db = client.test_db
        repo = AnnotationRepository(db)
        return repo, client

    @given(dangerous_strings(), st.data())
    @settings(max_examples=20)
    async def test_description_injection_safety(self, dangerous_string, data):
        """Test that dangerous strings in descriptions don't cause issues."""
        repo, client = await self._get_repo()

        try:
            annotation_data = data.draw(annotation_creates())
            annotation_data.description = dangerous_string

            # Should not raise exception
            result = await repo.create_versioned(annotation_data)
            assert result.description == dangerous_string

            # Should be retrievable
            retrieved = await repo.get_by_id(result.id)
            assert retrieved is not None
            assert retrieved.description == dangerous_string
        finally:
            client.close()

    @given(invalid_confidence_scores(), st.data())
    @settings(max_examples=10)
    async def test_invalid_confidence_scores(self, invalid_confidence, data):
        """Test behavior with invalid confidence scores."""
        repo, client = await self._get_repo()

        try:
            annotation_data = data.draw(annotation_creates())
            annotation_data.confidence = invalid_confidence

            # The model currently accepts all float values including NaN and infinity
            # This test verifies the system handles these values without crashing
            result = await repo.create_versioned(annotation_data)

            # For NaN values, we need special comparison since NaN != NaN
            if str(invalid_confidence) == "nan":
                assert math.isnan(result.confidence)
            else:
                assert result.confidence == invalid_confidence
        finally:
            client.close()

    async def test_nonexistent_id_operations(self):
        """Test operations with non-existent IDs."""
        repo, client = await self._get_repo()

        try:
            fake_id = ObjectId()

            # Should return None gracefully
            assert await repo.update_versioned(fake_id, AnnotationUpdate(description="test")) is None
            assert await repo.soft_delete_versioned(fake_id) is None
            assert await repo.get_latest_version_for_image(fake_id) is None

            # Should return empty results
            history = [ann async for ann in repo.get_version_history(fake_id)]
            assert len(history) == 0

            active = [ann async for ann in repo.get_active_annotations_for_image(fake_id)]
            assert len(active) == 0
        finally:
            client.close()

    @given(py_object_ids(), st.data())
    @settings(max_examples=5)
    async def test_version_history_ordering(self, image_id, data):
        """Test that version history is properly ordered."""
        repo, client = await self._get_repo()

        try:
            # Create multiple versions
            annotation_data = data.draw(annotation_creates())
            annotation_data.image_id = image_id

            versions = []
            current = await repo.create_versioned(annotation_data)
            versions.append(current)

            # Create updates
            for i in range(3):
                update = AnnotationUpdate(description=f"Version {i + 2}")
                current = await repo.update_versioned(current.id, update)
                versions.append(current)

            # Get history
            history = [ann async for ann in repo.get_version_history(image_id)]

            # Should be ordered by version descending
            history_versions = [ann.version for ann in history]
            assert history_versions == sorted(history_versions, reverse=True)

            # Should contain all versions
            assert len(history) == 4
        finally:
            client.close()
