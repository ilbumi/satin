"""Tests for repository classes."""

import pytest
from mongomock_motor import AsyncMongoMockClient, AsyncMongoMockDatabase

from satin.models.image import ImageCreate, ImageStatus, ImageUpdate
from satin.repositories.image import ImageRepository


@pytest.fixture
async def mock_db() -> AsyncMongoMockDatabase:
    """Create mock database."""
    client = AsyncMongoMockClient()
    return client.test_db


class TestImageRepository:
    """Test ImageRepository functionality."""

    async def test_create(self, mock_db: AsyncMongoMockDatabase):
        """Test creating an image."""
        repo = ImageRepository(mock_db)
        image_data = ImageCreate(url="http://test.com/image.jpg")

        result = await repo.create(image_data)

        assert str(result.url) == "http://test.com/image.jpg"
        assert result.status == ImageStatus.NEW
        assert result.id is not None

    async def test_get_by_id(self, mock_db: AsyncMongoMockDatabase):
        """Test getting image by ID."""
        repo = ImageRepository(mock_db)
        image_data = ImageCreate(url="http://test.com/image.jpg")

        created = await repo.create(image_data)
        result = await repo.get_by_id(created.id)

        assert result is not None
        assert str(result.url) == "http://test.com/image.jpg"

    async def test_find_by_status(self, mock_db: AsyncMongoMockDatabase):
        """Test finding images by status."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test1.com/image.jpg"))
        await repo.create(ImageCreate(url="http://test2.com/image.jpg"))

        results = [image async for image in repo.find_by_status(ImageStatus.NEW)]

        assert len(results) == 2

    async def test_count_by_status(self, mock_db: AsyncMongoMockDatabase):
        """Test counting images by status."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test1.com"))
        await repo.create(ImageCreate(url="http://test2.com"))

        count = await repo.count_by_status(ImageStatus.NEW)

        assert count == 2

    async def test_mark_as_annotated(self, mock_db: AsyncMongoMockDatabase):
        """Test marking image as annotated."""
        repo = ImageRepository(mock_db)
        created = await repo.create(ImageCreate(url="http://test.com"))

        result = await repo.mark_as_annotated(str(created.id))

        assert result is not None
        assert result.status == ImageStatus.ANNOTATED

    async def test_find_one(self, mock_db: AsyncMongoMockDatabase):
        """Test finding single image."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test.com"))

        result = await repo.find_one({"status": "new"})

        assert result is not None
        assert result.status == ImageStatus.NEW

    async def test_bulk_create(self, mock_db: AsyncMongoMockDatabase):
        """Test bulk creating images."""
        repo = ImageRepository(mock_db)
        images = [
            ImageCreate(url="http://test1.com"),
            ImageCreate(url="http://test2.com"),
        ]

        results = await repo.bulk_create(images)

        assert len(results) == 2
        assert all(img.status == ImageStatus.NEW for img in results)

    async def test_delete_by_id(self, mock_db: AsyncMongoMockDatabase):
        """Test deleting image by ID."""
        repo = ImageRepository(mock_db)
        created = await repo.create(ImageCreate(url="http://test.com"))

        deleted = await repo.delete_by_id(created.id)

        assert deleted is True

    async def test_exists(self, mock_db: AsyncMongoMockDatabase):
        """Test checking if image exists."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test.com"))

        exists = await repo.exists({"status": "new"})

        assert exists is True

    async def test_find_paginated(self, mock_db: AsyncMongoMockDatabase):
        """Test paginated find."""
        repo = ImageRepository(mock_db)
        for i in range(5):
            await repo.create(ImageCreate(url=f"http://test{i}.com"))

        results = [img async for img in repo.find_paginated({}, skip=1, limit=2)]

        assert len(results) == 2

    async def test_find_by_status_paginated(self, mock_db: AsyncMongoMockDatabase):
        """Test paginated find by status."""
        repo = ImageRepository(mock_db)
        for i in range(3):
            await repo.create(ImageCreate(url=f"http://test{i}.com"))

        results = [img async for img in repo.find_by_status_paginated(ImageStatus.NEW, skip=1, limit=1)]

        assert len(results) == 1

    async def test_find_new_images(self, mock_db: AsyncMongoMockDatabase):
        """Test finding new images."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test.com"))

        results = [img async for img in repo.find_new_images()]

        assert len(results) == 1
        assert results[0].status == ImageStatus.NEW

    async def test_find_annotated_images(self, mock_db: AsyncMongoMockDatabase):
        """Test finding annotated images."""
        repo = ImageRepository(mock_db)
        created = await repo.create(ImageCreate(url="http://test.com"))
        await repo.mark_as_annotated(str(created.id))

        results = [img async for img in repo.find_annotated_images()]

        assert len(results) == 1

    async def test_find_images_needing_reannotation(self, mock_db: AsyncMongoMockDatabase):
        """Test finding images needing re-annotation."""
        repo = ImageRepository(mock_db)
        created = await repo.create(ImageCreate(url="http://test.com"))

        await repo.update_by_id(created.id, ImageUpdate(status=ImageStatus.NEEDS_REANNOTATION))

        results = [img async for img in repo.find_images_needing_reannotation()]

        assert len(results) == 1

    async def test_find_by_dimensions(self, mock_db: AsyncMongoMockDatabase):
        """Test finding images by dimensions."""
        repo = ImageRepository(mock_db)
        # Create image with dimensions (would need to update model creation)
        created = await repo.create(ImageCreate(url="http://test.com"))
        # Manually update with dimensions for test
        await repo._collection.update_one({"_id": created.id}, {"$set": {"width": 800, "height": 600}})

        results = [img async for img in repo.find_by_dimensions(min_width=700, max_height=700)]

        assert len(results) == 1

    @pytest.mark.skip(reason="Error in mock")
    async def test_bulk_update(self, mock_db: AsyncMongoMockDatabase):
        """Test bulk updating images."""
        repo = ImageRepository(mock_db)
        img1 = await repo.create(ImageCreate(url="http://test1.com"))
        img2 = await repo.create(ImageCreate(url="http://test2.com"))

        updates = [
            ({"_id": img1.id}, ImageUpdate(status=ImageStatus.ANNOTATED)),
            ({"_id": img2.id}, ImageUpdate(status=ImageStatus.ANNOTATED)),
        ]

        count = await repo.bulk_update(updates)

        assert count == 2

    async def test_delete_many(self, mock_db: AsyncMongoMockDatabase):
        """Test deleting multiple images."""
        repo = ImageRepository(mock_db)
        await repo.create(ImageCreate(url="http://test1.com"))
        await repo.create(ImageCreate(url="http://test2.com"))

        count = await repo.delete_many({"status": "new"})

        assert count == 2
