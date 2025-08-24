"""Tests for ImageRepository."""

import pytest
from mongomock_motor import AsyncMongoMockDatabase

from satin.models.image import ImageStatus, ImageUpdate
from satin.repositories.image import ImageRepository
from tests.fixtures.sample_data import create_multiple_images, create_test_image


class TestImageRepositoryBasicOperations:
    async def test_create_and_get_by_id(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        image_data = create_test_image("http://test.com/image.jpg")

        result = await repo.create(image_data)
        retrieved = await repo.get_by_id(result.id)

        assert str(result.url) == "http://test.com/image.jpg"
        assert result.status == ImageStatus.NEW
        assert result.id is not None
        assert retrieved is not None
        assert str(retrieved.url) == "http://test.com/image.jpg"

    async def test_delete_by_id(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        created = await repo.create(create_test_image("http://test.com"))

        deleted = await repo.delete_by_id(created.id)
        not_found = await repo.get_by_id(created.id)

        assert deleted is True
        assert not_found is None

    async def test_bulk_create(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        images = create_multiple_images(3)

        results = await repo.bulk_create(images)

        assert len(results) == 3
        assert all(img.status == ImageStatus.NEW for img in results)

    async def test_mark_as_annotated(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        created = await repo.create(create_test_image("http://test.com"))

        result = await repo.mark_as_annotated(str(created.id))

        assert result is not None
        assert result.status == ImageStatus.ANNOTATED


class TestImageRepositoryQueries:
    async def test_find_by_status(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        await repo.create(create_test_image("http://test1.com"))
        await repo.create(create_test_image("http://test2.com"))

        results = [image async for image in repo.find_by_status(ImageStatus.NEW)]

        assert len(results) == 2

    async def test_count_by_status(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        await repo.create(create_test_image("http://test1.com"))
        await repo.create(create_test_image("http://test2.com"))

        count = await repo.count_by_status(ImageStatus.NEW)

        assert count == 2

    async def test_find_one(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        await repo.create(create_test_image("http://test.com"))

        result = await repo.find_one({"status": "new"})

        assert result is not None
        assert result.status == ImageStatus.NEW

    async def test_exists(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        await repo.create(create_test_image("http://test.com"))

        exists = await repo.exists({"status": "new"})

        assert exists is True

    async def test_find_paginated(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        for i in range(5):
            await repo.create(create_test_image(f"http://test{i}.com"))

        results = [img async for img in repo.find_paginated({}, skip=1, limit=2)]

        assert len(results) == 2

    @pytest.mark.parametrize(
        ("status_filter", "expected_method"),
        [
            (ImageStatus.NEW, "find_new_images"),
            (ImageStatus.ANNOTATED, "find_annotated_images"),
            (ImageStatus.NEEDS_REANNOTATION, "find_images_needing_reannotation"),
        ],
    )
    async def test_specialized_finders(self, mock_db: AsyncMongoMockDatabase, status_filter, expected_method):
        repo = ImageRepository(mock_db)
        created = await repo.create(create_test_image("http://test.com"))

        if status_filter != ImageStatus.NEW:
            await repo.update_by_id(created.id, ImageUpdate(status=status_filter))

        finder = getattr(repo, expected_method)
        results = [img async for img in finder()]

        assert len(results) == 1
        assert results[0].status == status_filter


class TestImageRepositoryBulkOperations:
    async def test_delete_many(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        await repo.create(create_test_image("http://test1.com"))
        await repo.create(create_test_image("http://test2.com"))

        count = await repo.delete_many({"status": "new"})

        assert count == 2

    async def test_find_by_dimensions(self, mock_db: AsyncMongoMockDatabase):
        repo = ImageRepository(mock_db)
        created = await repo.create(create_test_image("http://test.com"))
        # Manually update with dimensions for test
        await repo._collection.update_one({"_id": created.id}, {"$set": {"width": 800, "height": 600}})

        results = [img async for img in repo.find_by_dimensions(min_width=700, max_height=700)]

        assert len(results) == 1
