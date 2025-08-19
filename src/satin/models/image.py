"""Pydantic model for Image."""

from pydantic import AnyUrl, BaseModel, Field


class Image(BaseModel):
    """Image model for annotation images."""

    id: str = Field(..., description="Unique identifier for the image")
    url: AnyUrl = Field(..., description="URL of the image (HTTP/HTTPS/data URLs)")

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
