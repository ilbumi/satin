"""Pydantic models for Annotation and BBox."""

from pydantic import BaseModel, Field


class Annotation(BaseModel):
    """Annotation model for image annotations."""

    text: str | None = Field(default=None, description="Text annotation")
    tags: list[str] | None = Field(default=None, description="List of tags")

    def __str__(self) -> str:
        """Get string representation of the Annotation."""
        return f"Annotation(text={self.text}, tags={self.tags})"


class BBox(BaseModel):
    """Bounding box model with annotation."""

    x: float = Field(..., description="X coordinate of the bounding box", gt=0)
    y: float = Field(..., description="Y coordinate of the bounding box", gt=0)
    width: float = Field(..., description="Width of the bounding box", gt=0)
    height: float = Field(..., description="Height of the bounding box", gt=0)
    annotation: Annotation = Field(..., description="Annotation for the bounding box")

    def __str__(self) -> str:
        """Get string representation of the BBox."""
        return f"BBox(x={self.x}, y={self.y}, width={self.width}, height={self.height}, annotation={self.annotation})"
