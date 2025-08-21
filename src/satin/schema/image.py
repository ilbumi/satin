from datetime import datetime

import strawberry

from satin.models.image import Image as ImageModel


@strawberry.type
class ImageDimensions:
    width: int
    height: int


@strawberry.type
class ImageMetadata:
    filename: str
    size: int
    mime_type: str
    format: str | None
    uploaded_at: datetime
    is_uploaded: bool


@strawberry.experimental.pydantic.type(model=ImageModel)
class Image:
    id: strawberry.auto
    url: strawberry.auto
    dimensions: ImageDimensions | None
    metadata: ImageMetadata | None
