"""Pydantic model for Image."""

from pydantic import BaseModel, Field, HttpUrl


class Image(BaseModel):
    """Image model for annotation images."""

    id: str = Field(..., description="Unique identifier for the image")
    url: HttpUrl = Field(..., description="URL of the image")

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
