"""Tag models."""

from pydantic import BaseModel

from satin.models.base import SatinBaseModel


class TagCreate(BaseModel):
    """Schema for creating a tag."""

    name: str
    description: str = ""
    parent_id: str | None = None
    color: str | None = None


class TagUpdate(BaseModel):
    """Schema for updating a tag."""

    name: str | None = None
    description: str | None = None
    parent_id: str | None = None
    color: str | None = None


class Tag(SatinBaseModel):
    """Tag model."""

    name: str
    description: str = ""
    parent_id: str | None = None
    path: str = ""
    depth: int = 0
    color: str | None = None
    usage_count: int = 0
