"""Image models."""

from enum import StrEnum

from pydantic import BaseModel

from satin.utils import SerializableHttpUrl

from .base import SatinBaseModel


class ImageStatus(StrEnum):
    """Image processing status."""

    NEW = "new"
    ANNOTATED = "annotated"
    NEEDS_REANNOTATION = "needs_reannotation"


class ImageCreate(BaseModel):
    """Schema for creating a new image."""

    url: SerializableHttpUrl


class ImageUpdate(BaseModel):
    """Schema for updating an image."""

    status: ImageStatus | None = None


class Image(SatinBaseModel):
    """Image model."""

    url: SerializableHttpUrl
    width: int | None = None
    height: int | None = None
    ext: str | None = None
    status: ImageStatus = ImageStatus.NEW
