"""Annotation models."""

from enum import StrEnum

from pydantic import BaseModel, Field

from satin.models.base import PyObjectId, SatinBaseModel


class ChangeType(StrEnum):
    """Type of change for versioning."""

    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class BoundingBox(BaseModel):
    """Bounding box coordinates."""

    x: float
    y: float
    width: float
    height: float


class AnnotationCreate(BaseModel):
    """Schema for creating an annotation."""

    image_id: PyObjectId
    bounding_box: BoundingBox
    tags: list[PyObjectId] = Field(default_factory=list)
    description: str = ""
    confidence: float | None = None
    version: int = 1
    change_type: ChangeType = ChangeType.CREATE


class AnnotationUpdate(BaseModel):
    """Schema for updating an annotation."""

    bounding_box: BoundingBox | None = None
    tags: list[PyObjectId] | None = None
    description: str | None = None
    confidence: float | None = None


class Annotation(SatinBaseModel):
    """Annotation model."""

    image_id: PyObjectId
    bounding_box: BoundingBox
    tags: list[PyObjectId] = Field(default_factory=list)
    description: str = ""
    confidence: float | None = None
    source: str = "manual"
    version: int = 1
    change_type: ChangeType = ChangeType.CREATE
