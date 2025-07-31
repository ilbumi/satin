from bson import ObjectId

from satin.repositories import ImageRepository
from satin.schema.image import Image
from tests.conftest import DatabaseFactory


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

    async def test_create_image(self):
        """Test creating a new image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        image = await image_repo.create_image("https://example.com/test-image.jpg")

        assert image.url == "https://example.com/test-image.jpg"
        assert image.id is not None

        # Verify it's in the database
        stored = await image_repo.db["images"].find_one({"_id": ObjectId(image.id)})
        assert stored is not None
        assert stored["url"] == "https://example.com/test-image.jpg"

    async def test_get_image(self):
        """Test retrieving an image by ID."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Create a test image
        created_image = await image_repo.create_image("https://example.com/test-image.jpg")

        # Retrieve it
        retrieved_image = await image_repo.get_image(created_image.id)

        assert retrieved_image is not None
        assert retrieved_image.id == created_image.id
        assert retrieved_image.url == "https://example.com/test-image.jpg"

    async def test_get_image_not_found(self):
        """Test retrieving a non-existent image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        image = await image_repo.get_image("507f1f77bcf86cd799439011")
        assert image is None

    async def test_get_all_images(self):
        """Test retrieving all images."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Create multiple images
        await image_repo.create_image("https://example.com/image1.jpg")
        await image_repo.create_image("https://example.com/image2.jpg")
        await image_repo.create_image("https://example.com/image3.jpg")

        # Retrieve all images
        images = await image_repo.get_all_images()

        assert len(images) == 3
        image_urls = {img.url for img in images}
        expected_urls = {
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg",
            "https://example.com/image3.jpg",
        }
        assert image_urls == expected_urls

    async def test_get_all_images_empty(self):
        """Test retrieving all images when none exist."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        images = await image_repo.get_all_images()

        assert len(images) == 0

    async def test_update_image(self):
        """Test updating an image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Create an image
        image = await image_repo.create_image("https://example.com/original.jpg")

        # Update it
        success = await image_repo.update_image(image.id, url="https://example.com/updated.jpg")
        updated_image = await image_repo.get_image(image.id) if success else None

        assert updated_image is not None
        assert updated_image.id == image.id
        assert updated_image.url == "https://example.com/updated.jpg"

    async def test_update_image_not_found(self):
        """Test updating a non-existent image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        success = await image_repo.update_image("507f1f77bcf86cd799439011", url="https://example.com/updated.jpg")
        assert success is False

    async def test_update_image_no_changes(self):
        """Test updating an image with no actual changes."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Create an image
        image = await image_repo.create_image("https://example.com/test.jpg")

        # Update with no changes
        success = await image_repo.update_image(image.id)
        updated_image = await image_repo.get_image(image.id)

        assert success is False  # No changes means no update
        assert updated_image is not None
        assert updated_image.url == "https://example.com/test.jpg"

    async def test_delete_image(self):
        """Test deleting an image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Create an image
        image = await image_repo.create_image("https://example.com/test.jpg")

        # Delete it
        deleted = await image_repo.delete_image(image.id)
        assert deleted is True

        # Verify it's gone
        retrieved = await image_repo.get_image(image.id)
        assert retrieved is None

    async def test_delete_image_not_found(self):
        """Test deleting a non-existent image."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        deleted = await image_repo.delete_image("507f1f77bcf86cd799439011")
        assert deleted is False

    async def test_count_all_images(self):
        """Test counting all images."""
        db, client = await DatabaseFactory.create_test_db()
        image_repo = ImageRepository(db)

        # Initially should be 0
        count = await image_repo.count_all_images()
        assert count == 0

        # Create some images
        await image_repo.create_image("https://example.com/image1.jpg")
        await image_repo.create_image("https://example.com/image2.jpg")
        await image_repo.create_image("https://example.com/image3.jpg")

        # Should now be 3
        count = await image_repo.count_all_images()
        assert count == 3

        # Delete one image
        images = await image_repo.get_all_images()
        await image_repo.delete_image(images[0].id)

        # Should now be 2
        count = await image_repo.count_all_images()
        assert count == 2
