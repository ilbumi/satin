"""GraphQL schema definition."""

import strawberry

from satin.dependencies import dependencies
from satin.models.image import ImageCreate, ImageUpdate

from .types import Image, ImageCreateInput, ImageUpdateInput


@strawberry.type
class Query:
    """GraphQL queries."""

    @strawberry.field
    async def images(self) -> list[Image]:
        """Get all images."""
        images = [img async for img in dependencies.image_repo.find()]
        return [Image.from_model(img) for img in images]

    @strawberry.field
    async def image(self, id: str) -> Image | None:  # noqa: A002
        """Get image by ID."""
        image = await dependencies.image_repo.get_by_id(id)
        return Image.from_model(image) if image else None


@strawberry.type
class Mutation:
    """GraphQL mutations."""

    @strawberry.mutation
    async def create_image(self, input: ImageCreateInput) -> Image:  # noqa: A002
        """Create a new image."""
        image_create = ImageCreate(url=input.url)  # type: ignore[arg-type]
        image = await dependencies.image_repo.create(image_create)
        return Image.from_model(image)

    @strawberry.mutation
    async def update_image(self, id: str, input: ImageUpdateInput) -> Image | None:  # noqa: A002
        """Update an existing image."""
        update_data = {}
        if input.status is not None:
            update_data["status"] = input.status

        if not update_data:
            # If no updates, return current image
            image = await dependencies.image_repo.get_by_id(id)
            return Image.from_model(image) if image else None

        # Create ImageUpdate model from update_data
        image_update = ImageUpdate(**update_data)
        image = await dependencies.image_repo.update_by_id(id, image_update)
        return Image.from_model(image) if image else None

    @strawberry.mutation
    async def delete_image(self, id: str) -> bool:  # noqa: A002
        """Delete an image."""
        try:
            return await dependencies.image_repo.delete_by_id(id)
        except Exception:  # noqa: BLE001
            # Return False if ID is invalid or other error occurs
            return False


schema = strawberry.Schema(query=Query, mutation=Mutation)
