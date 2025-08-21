"""Pydantic model for Image."""

from datetime import datetime

from pydantic import BaseModel, Field


class ImageDimensions(BaseModel):
    """Image dimensions model."""

    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")


class ImageMetadata(BaseModel):
    """Image metadata model."""

    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the image")
    format: str | None = Field(None, description="Image format (JPEG, PNG, etc.)")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")
    is_uploaded: bool = Field(default=False, description="Whether image was uploaded vs URL")


class Image(BaseModel):
    """Image model for annotation images."""

    id: str = Field(..., description="Unique identifier for the image")
    url: str = Field(..., description="URL of the image (HTTP/HTTPS/data URLs)")
    dimensions: ImageDimensions | None = Field(None, description="Image dimensions")
    metadata: ImageMetadata | None = Field(None, description="Image metadata")

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
