"""GraphQL types for Satin API."""

from datetime import UTC, datetime
from enum import Enum

import strawberry

from satin.models.annotation import Annotation as AnnotationModel
from satin.models.annotation import BoundingBox as BoundingBoxModel
from satin.models.image import Image as ImageModel
from satin.models.ml_job import MLJob as MLJobModel
from satin.models.ml_job import MLJobStatus
from satin.models.tag import Tag as TagModel


@strawberry.enum
class ImageStatus(Enum):
    """GraphQL ImageStatus enum."""

    NEW = "new"
    ANNOTATED = "annotated"
    NEEDS_REANNOTATION = "needs_reannotation"


@strawberry.type
class Image:
    """GraphQL Image type."""

    id: str
    url: str
    width: int | None = None
    height: int | None = None
    ext: str | None = None
    status: ImageStatus
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, image: ImageModel) -> "Image":
        """Create GraphQL Image from model."""
        return cls(
            id=str(image.id) if image.id else "",
            url=str(image.url),
            width=image.width,
            height=image.height,
            ext=image.ext,
            status=ImageStatus(image.status),
            created_at=image.created_at.isoformat(),
            updated_at=image.updated_at.isoformat(),
        )


@strawberry.input
class ImageCreateInput:
    """Input for creating an image."""

    url: str


@strawberry.input
class ImageUpdateInput:
    """Input for updating an image."""

    status: ImageStatus | None = None


@strawberry.type
class BoundingBox:
    """GraphQL BoundingBox type."""

    x: float
    y: float
    width: float
    height: float

    @classmethod
    def from_model(cls, bbox: BoundingBoxModel) -> "BoundingBox":
        """Create GraphQL BoundingBox from model."""
        return cls(
            x=bbox.x,
            y=bbox.y,
            width=bbox.width,
            height=bbox.height,
        )


@strawberry.input
class BoundingBoxInput:
    """Input for bounding box coordinates."""

    x: float
    y: float
    width: float
    height: float


@strawberry.type
class Annotation:
    """GraphQL Annotation type."""

    id: str
    image_id: str
    bounding_box: BoundingBox
    tags: list[str]
    description: str
    confidence: float | None
    source: str
    version: int
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, annotation: AnnotationModel) -> "Annotation":
        """Create GraphQL Annotation from model."""
        return cls(
            id=str(annotation.id) if annotation.id else "",
            image_id=str(annotation.image_id),
            bounding_box=BoundingBox.from_model(annotation.bounding_box),
            tags=[str(tag) for tag in annotation.tags],
            description=annotation.description,
            confidence=annotation.confidence,
            source=annotation.source,
            version=annotation.version,
            created_at=annotation.created_at.isoformat(),
            updated_at=annotation.updated_at.isoformat(),
        )


@strawberry.input
class AnnotationCreateInput:
    """Input for creating an annotation."""

    image_id: str
    bounding_box: BoundingBoxInput
    tags: list[str] = strawberry.field(default_factory=list)
    description: str = ""
    confidence: float | None = None


@strawberry.input
class AnnotationUpdateInput:
    """Input for updating an annotation."""

    bounding_box: BoundingBoxInput | None = None
    tags: list[str] | None = None
    description: str | None = None
    confidence: float | None = None


@strawberry.type
class Tag:
    """GraphQL Tag type."""

    id: str
    name: str
    description: str
    parent_id: str | None
    path: str
    depth: int
    color: str | None
    usage_count: int
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, tag: TagModel) -> "Tag":
        """Create GraphQL Tag from model."""
        return cls(
            id=str(tag.id) if tag.id else "",
            name=tag.name,
            description=tag.description,
            parent_id=tag.parent_id,
            path=tag.path,
            depth=tag.depth,
            color=tag.color,
            usage_count=tag.usage_count,
            created_at=tag.created_at.isoformat(),
            updated_at=tag.updated_at.isoformat(),
        )


@strawberry.input
class TagCreateInput:
    """Input for creating a tag."""

    name: str
    description: str = ""
    parent_id: str | None = None
    color: str | None = None


@strawberry.input
class TagUpdateInput:
    """Input for updating a tag."""

    name: str | None = None
    description: str | None = None
    parent_id: str | None = None
    color: str | None = None


@strawberry.type
class MLJob:
    """GraphQL MLJob type."""

    id: str
    image_url: str = strawberry.field(name="imageUrl")
    endpoint: str
    status: str
    error_message: str | None = strawberry.field(name="errorMessage")
    predictions: list[Annotation]
    created_at: str = strawberry.field(name="createdAt")
    updated_at: str = strawberry.field(name="updatedAt")

    @classmethod
    def from_model(cls, ml_job: MLJobModel) -> "MLJob":
        """Create GraphQL MLJob from model."""
        # Convert predictions to GraphQL Annotations
        prediction_annotations = []
        for pred in ml_job.predictions:
            # Create a temporary annotation model for conversion
            annotation_dict = pred.model_dump()
            # Add required fields that might be missing
            annotation_dict["source"] = "ml"
            annotation_dict["version"] = 1
            annotation_dict["created_at"] = datetime.now(UTC)
            annotation_dict["updated_at"] = datetime.now(UTC)

            # Convert PyObjectId to string for tags
            if "tags" in annotation_dict:
                annotation_dict["tags"] = [str(tag) for tag in annotation_dict["tags"]]

            temp_annotation = AnnotationModel(**annotation_dict)
            prediction_annotations.append(Annotation.from_model(temp_annotation))

        return cls(
            id=str(ml_job.id) if ml_job.id else "",
            image_url=str(ml_job.image_url),
            endpoint=ml_job.endpoint,
            status=ml_job.status.value,
            error_message=ml_job.error_message,
            predictions=prediction_annotations,
            created_at=ml_job.created_at.isoformat(),
            updated_at=ml_job.updated_at.isoformat(),
        )


@strawberry.input
class MLJobCreateInput:
    """Input for creating an ML job."""

    image_url: str = strawberry.field(name="imageUrl")
    endpoint: str


@strawberry.input
class MLJobUpdateInput:
    """Input for updating an ML job."""

    status: MLJobStatus | None = None
    error_message: str | None = strawberry.field(default=None, name="errorMessage")
