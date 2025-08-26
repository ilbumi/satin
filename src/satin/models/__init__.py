"""Pydantic models for the Satin application."""

from .annotation import Annotation, AnnotationCreate, AnnotationUpdate, BoundingBox
from .base import BaseModel, PyObjectId
from .image import Image, ImageCreate, ImageStatus, ImageUpdate
from .ml_job import MLJob, MLJobCreate, MLJobStatus, MLJobUpdate
from .tag import Tag, TagCreate, TagUpdate

__all__ = [
    "Annotation",
    "AnnotationCreate",
    "AnnotationUpdate",
    "BaseModel",
    "BoundingBox",
    "Image",
    "ImageCreate",
    "ImageStatus",
    "ImageUpdate",
    "MLJob",
    "MLJobCreate",
    "MLJobStatus",
    "MLJobUpdate",
    "PyObjectId",
    "Tag",
    "TagCreate",
    "TagUpdate",
]
