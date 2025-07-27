from collections.abc import AsyncIterator

import strawberry
from bson import ObjectId

from satin.db import db


@strawberry.type
class Image:
    id: strawberry.ID
    url: str

    def __str__(self):
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"


async def get_image(id: strawberry.ID) -> Image | None:  # noqa: A002
    """Fetch an image by its ID from the database."""
    image_data = await db["images"].find_one({"_id": ObjectId(id)})
    if image_data:
        image_data["id"] = str(image_data["_id"])
        del image_data["_id"]
        return Image(**image_data)
    return None


async def get_all_images() -> AsyncIterator[Image]:
    """Fetch all images from the database as async generator."""
    async for image_data in db["images"].find():
        image_data["id"] = str(image_data["_id"])
        del image_data["_id"]
        yield Image(**image_data)


async def create_image(url: str) -> Image:
    """Create a new image in the database."""
    image_data = {"url": url}
    result = await db["images"].insert_one(image_data)
    image_data["id"] = str(result.inserted_id)
    image_data.pop("_id", None)
    return Image(**image_data)  # type: ignore[arg-type]


async def update_image(id: strawberry.ID, url: str | None = None) -> Image | None:  # noqa: A002
    """Update an image in the database."""
    update_data = {}
    if url is not None:
        update_data["url"] = url

    if update_data:
        await db["images"].update_one({"_id": ObjectId(id)}, {"$set": update_data})

    return await get_image(id)


async def delete_image(id: strawberry.ID) -> bool:  # noqa: A002
    """Delete an image from the database."""
    result = await db["images"].delete_one({"_id": ObjectId(id)})
    return result.deleted_count > 0
