import pytest
from bson import ObjectId

from satin.schema.image import (
    Image,
    create_image,
    delete_image,
    get_all_images,
    get_image,
    update_image,
)


class TestImage:
    """Test cases for Image schema."""

    def test_image_creation(self):
        """Test Image object creation."""
        image = Image(id="123", url="https://example.com/image.jpg")
        assert image.id == "123"
        assert image.url == "https://example.com/image.jpg"

    def test_image_str_representation(self):
        """Test Image string representation."""
        image = Image(id="123", url="https://example.com/image.jpg")
        expected = "Image(id=123, url=https://example.com/image.jpg)"
        assert str(image) == expected


class TestImageFunctions:
    """Test cases for image database functions."""

    @pytest.mark.asyncio
    async def test_create_image(self, test_db, monkeypatch):
        """Test creating a new image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        image = await create_image("https://example.com/test-image.jpg")

        assert image.url == "https://example.com/test-image.jpg"
        assert image.id is not None

        # Verify it's in the database
        stored = await test_db["images"].find_one({"_id": ObjectId(image.id)})
        assert stored is not None
        assert stored["url"] == "https://example.com/test-image.jpg"

    @pytest.mark.asyncio
    async def test_get_image(self, test_db, monkeypatch):
        """Test retrieving an image by ID."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        # Create a test image
        created_image = await create_image("https://example.com/test-image.jpg")

        # Retrieve it
        retrieved_image = await get_image(created_image.id)

        assert retrieved_image is not None
        assert retrieved_image.id == created_image.id
        assert retrieved_image.url == "https://example.com/test-image.jpg"

    @pytest.mark.asyncio
    async def test_get_image_not_found(self, test_db, monkeypatch):
        """Test retrieving a non-existent image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        image = await get_image("507f1f77bcf86cd799439011")
        assert image is None

    @pytest.mark.asyncio
    async def test_get_all_images(self, test_db, monkeypatch):
        """Test retrieving all images."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        # Create multiple images
        await create_image("https://example.com/image1.jpg")
        await create_image("https://example.com/image2.jpg")
        await create_image("https://example.com/image3.jpg")

        # Retrieve all images
        images = await get_all_images()

        assert len(images) == 3
        image_urls = {img.url for img in images}
        expected_urls = {
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg",
            "https://example.com/image3.jpg",
        }
        assert image_urls == expected_urls

    @pytest.mark.asyncio
    async def test_get_all_images_empty(self, test_db, monkeypatch):
        """Test retrieving all images when none exist."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        images = await get_all_images()

        assert len(images) == 0

    @pytest.mark.asyncio
    async def test_update_image(self, test_db, monkeypatch):
        """Test updating an image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        # Create an image
        image = await create_image("https://example.com/original.jpg")

        # Update it
        updated_image = await update_image(image.id, url="https://example.com/updated.jpg")

        assert updated_image is not None
        assert updated_image.id == image.id
        assert updated_image.url == "https://example.com/updated.jpg"

    @pytest.mark.asyncio
    async def test_update_image_not_found(self, test_db, monkeypatch):
        """Test updating a non-existent image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        updated_image = await update_image("507f1f77bcf86cd799439011", url="https://example.com/updated.jpg")
        assert updated_image is None

    @pytest.mark.asyncio
    async def test_update_image_no_changes(self, test_db, monkeypatch):
        """Test updating an image with no actual changes."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        # Create an image
        image = await create_image("https://example.com/test.jpg")

        # Update with no changes
        updated_image = await update_image(image.id)

        assert updated_image is not None
        assert updated_image.url == "https://example.com/test.jpg"

    @pytest.mark.asyncio
    async def test_delete_image(self, test_db, monkeypatch):
        """Test deleting an image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        # Create an image
        image = await create_image("https://example.com/test.jpg")

        # Delete it
        deleted = await delete_image(image.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await get_image(image.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_image_not_found(self, test_db, monkeypatch):
        """Test deleting a non-existent image."""
        monkeypatch.setattr("satin.schema.image.db", test_db)

        deleted = await delete_image("507f1f77bcf86cd799439011")
        assert deleted is False
