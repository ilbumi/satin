"""Pydantic model for Image."""

from pydantic import BaseModel, Field, HttpUrl, field_validator

from satin.validators import validate_url


class Image(BaseModel):
    """Image model for annotation images."""

    id: str = Field(..., description="Unique identifier for the image")
    url: HttpUrl = Field(..., description="URL of the image")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: HttpUrl) -> HttpUrl:
        """Validate image URL to prevent SSRF attacks."""
        # Convert HttpUrl to string for validation, then back to HttpUrl
        validated_str = validate_url(str(v), allow_local=False)
        return HttpUrl(validated_str)

    def __str__(self) -> str:
        """Get string representation of the Image."""
        return f"Image(id={self.id}, url={self.url})"
