"""Pydantic models for Task."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator

from satin.constants import MAX_BBOXES_PER_TASK

from .annotation import BBox
from .image import Image
from .project import Project


class TaskStatus(StrEnum):
    """Task status enumeration."""

    DRAFT = "draft"
    FINISHED = "finished"
    REVIEWED = "reviewed"


class Task(BaseModel):
    """Task model for annotation tasks."""

    id: str = Field(..., description="Unique identifier for the task")
    image: Image = Field(..., description="Image associated with the task")
    project: Project = Field(..., description="Project the task belongs to")
    bboxes: list[BBox] = Field(
        default_factory=list, description="List of bounding boxes", max_length=MAX_BBOXES_PER_TASK
    )
    status: TaskStatus = Field(default=TaskStatus.DRAFT, description="Status of the task")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")

    @field_validator("bboxes")
    @classmethod
    def validate_bboxes(cls, v: list[BBox]) -> list[BBox]:
        """Validate bounding boxes list."""
        if len(v) > MAX_BBOXES_PER_TASK:
            msg = f"Too many bounding boxes (maximum {MAX_BBOXES_PER_TASK})"
            raise ValueError(msg)
        return v

    def __str__(self) -> str:
        """Get string representation of the Task."""
        return f"Task(id={self.id}, project={self.project.name}, image={self.image.url}, status={self.status})"
