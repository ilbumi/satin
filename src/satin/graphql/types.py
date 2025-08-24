"""GraphQL types for Satin API."""

import strawberry

from satin.models.image import Image as ImageModel
from satin.models.image import ImageStatus


@strawberry.type
class Image:
    """GraphQL Image type."""

    id: str
    url: str
    width: int | None = None
    height: int | None = None
    ext: str | None = None
    status: ImageStatus
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, image: ImageModel) -> "Image":
        """Create GraphQL Image from model."""
        return cls(
            id=str(image.id) if image.id else "",
            url=str(image.url),
            width=image.width,
            height=image.height,
            ext=image.ext,
            status=image.status,
            created_at=image.created_at.isoformat(),
            updated_at=image.updated_at.isoformat(),
        )


@strawberry.input
class ImageCreateInput:
    """Input for creating an image."""

    url: str


@strawberry.input
class ImageUpdateInput:
    """Input for updating an image."""

    status: ImageStatus | None = None
