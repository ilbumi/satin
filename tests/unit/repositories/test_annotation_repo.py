"""Tests for AnnotationRepository with versioning."""

from bson import ObjectId
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.annotation import AnnotationUpdate
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
