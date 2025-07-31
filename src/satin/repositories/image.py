from typing import Any

import strawberry
from pymongo.asynchronous.database import AsyncDatabase

from satin.schema.image import Image

from .base import BaseRepository


class ImageRepository(BaseRepository[Image]):
    """Repository for Image domain objects."""

    def __init__(self, db: AsyncDatabase):
        """Initialize the ImageRepository with a database connection."""
        super().__init__(db, "images")

    async def to_domain_object(self, data: dict[str, Any]) -> Image:
        """Convert database document to Image domain object."""
        data = self._convert_id(data)
        return Image(**data)

    async def get_image(self, image_id: strawberry.ID) -> Image | None:
        """Fetch an image by its ID from the database."""
        image_data = await self.find_by_id(image_id)
        if image_data:
            return await self.to_domain_object(image_data)
        return None

    async def get_all_images(self, limit: int | None = None, offset: int = 0) -> list[Image]:
        """Fetch paginated images using MongoDB aggregation pipeline."""
        results_data = await self.find_all(limit=limit, offset=offset)
        return [await self.to_domain_object(data) for data in results_data]

    async def create_image(self, url: str) -> Image:
        """Create a new image in the database."""
        image_data = {"url": url}
        created_data = await self.create(image_data)
        return await self.to_domain_object(created_data)

    async def update_image(self, image_id: strawberry.ID, url: str | None = None) -> bool:
        """Update an image in the database."""
        update_data = {}
        if url is not None:
            update_data["url"] = url

        return await self.update_by_id(image_id, update_data)

    async def delete_image(self, image_id: strawberry.ID) -> bool:
        """Delete an image from the database."""
        return await self.delete_by_id(image_id)
