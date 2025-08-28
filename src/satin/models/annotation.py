"""Annotation models."""

from pydantic import BaseModel, Field, field_validator

from satin.models.base import PyObjectId, SatinBaseModel


class BoundingBox(BaseModel):
    """Bounding box coordinates."""

    x: float
    y: float
    width: float = Field(gt=0, description="Width must be positive")
    height: float = Field(gt=0, description="Height must be positive")

    @field_validator("x", "y")
    @classmethod
    def validate_coordinates(cls, v: float) -> float:
        """Validate that coordinates are non-negative."""
        if v < 0:
            msg = "Coordinates must be non-negative"
            raise ValueError(msg)
        return v


class AnnotationCreate(BaseModel):
    """Schema for creating an annotation."""

    image_id: PyObjectId
    bounding_box: BoundingBox
    tags: list[str] = Field(default_factory=list)
    description: str = ""
    confidence: float | None = None


class AnnotationUpdate(BaseModel):
    """Schema for updating an annotation."""

    bounding_box: BoundingBox | None = None
    tags: list[str] | None = None
    description: str | None = None
    confidence: float | None = None


class Annotation(SatinBaseModel):
    """Annotation model."""

    image_id: PyObjectId
    bounding_box: BoundingBox
    tags: list[str] = Field(default_factory=list)
    description: str = ""
    confidence: float | None = None
    source: str = "manual"
