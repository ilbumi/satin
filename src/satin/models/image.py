"""Pydantic model for Image."""

from pydantic import BaseModel, Field, field_validator

from satin.config import config
from satin.validators import validate_url


class Image(BaseModel):
    """Image model for annotation images."""

    id: str = Field(..., description="Unique identifier for the image")
    url: str = Field(..., description="URL of the image (HTTP/HTTPS/data URLs)")

    @field_validator("url")
    @classmethod
    def validate_url_field(cls, v: str) -> str:
        """Validate URL using custom validator that allows HTTP/HTTPS/data URLs."""
        return validate_url(v, allow_local=config.allow_local_urls)

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
