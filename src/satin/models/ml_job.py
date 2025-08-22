"""ML job models."""

from enum import StrEnum

from pydantic import BaseModel, Field, HttpUrl

from satin.models.annotation import AnnotationCreate

from .base import SatinBaseModel


class MLJobStatus(StrEnum):
    """ML job status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MLJobCreate(BaseModel):
    """Schema for creating an ML job."""

    image_url: HttpUrl
    endpoint: str


class MLJobUpdate(BaseModel):
    """Schema for updating an ML job."""

    status: MLJobStatus | None = None
    error_message: str | None = None
    predictions: list[AnnotationCreate] | None = None


class MLJob(SatinBaseModel):
    """ML job model."""

    image_url: HttpUrl
    endpoint: str
    status: MLJobStatus = MLJobStatus.PENDING
    error_message: str | None = None
    predictions: list[AnnotationCreate] = Field(default_factory=list)
