"""Pydantic models for Annotation and BBox."""

from pydantic import BaseModel, Field, field_validator

from satin.constants import MAX_BBOX_COORDINATE
from satin.exceptions import CoordinateValidationError
from satin.validators import sanitize_string, validate_tags


class Annotation(BaseModel):
    """Annotation model for image annotations."""

    text: str | None = Field(default=None, description="Text annotation", max_length=1000)
    tags: list[str] | None = Field(default=None, description="List of tags", max_length=50)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str | None) -> str | None:
        """Validate annotation text."""
        if v is None:
            return v
        return sanitize_string(v, max_length=1000)

    @field_validator("tags")
    @classmethod
    def validate_tags_list(cls, v: list[str] | None) -> list[str] | None:
        """Validate tags list."""
        if v is None:
            return v
        return validate_tags(v)

    def __str__(self) -> str:
        """Get string representation of the Annotation."""
        return f"Annotation(text={self.text}, tags={self.tags})"


class BBox(BaseModel):
    """Bounding box model with annotation."""

    x: float = Field(..., description="X coordinate of the bounding box", ge=0, le=MAX_BBOX_COORDINATE)
    y: float = Field(..., description="Y coordinate of the bounding box", ge=0, le=MAX_BBOX_COORDINATE)
    width: float = Field(..., description="Width of the bounding box", gt=0, le=MAX_BBOX_COORDINATE)
    height: float = Field(..., description="Height of the bounding box", gt=0, le=MAX_BBOX_COORDINATE)
    annotation: Annotation = Field(..., description="Annotation for the bounding box")

    @field_validator("x", "y", "width", "height")
    @classmethod
    def validate_coordinates(cls, v: float, info) -> float:
        """Validate bounding box coordinates."""
        if v < 0:
            raise CoordinateValidationError.negative_coordinate(info.field_name)
        if v > MAX_BBOX_COORDINATE:
            raise CoordinateValidationError.exceeds_maximum(info.field_name, MAX_BBOX_COORDINATE)
        return v

    def __str__(self) -> str:
        """Get string representation of the BBox."""
        return f"BBox(x={self.x}, y={self.y}, width={self.width}, height={self.height}, annotation={self.annotation})"
