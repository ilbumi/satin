"""GraphQL schema definition."""

from typing import Any

import strawberry

from satin.dependencies import dependencies
from satin.models.annotation import AnnotationCreate, AnnotationUpdate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageStatus, ImageUpdate
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.utils import SerializableHttpUrl

from .types import (
    Annotation,
    AnnotationCreateInput,
    AnnotationUpdateInput,
    Image,
    ImageCreateInput,
    ImageUpdateInput,
    MLJob,
    MLJobCreateInput,
)


@strawberry.type
class Query:
    """GraphQL queries."""

    @strawberry.field
    async def images(self) -> list[Image]:
        """Get all images."""
        images = [img async for img in dependencies.image_repo.find()]
        return [Image.from_model(img) for img in images]

    @strawberry.field
    async def image(self, id: str) -> Image | None:  # noqa: A002
        """Get image by ID."""
        image = await dependencies.image_repo.get_by_id(id)
        return Image.from_model(image) if image else None

    @strawberry.field
    async def images_by_status(self, statuses: list[str]) -> list[Image]:
        """Get images by status."""
        images = []
        for status_str in statuses:
            try:
                status = ImageStatus(status_str)
                status_images = [img async for img in dependencies.image_repo.find_by_status(status)]
                images.extend(status_images)
            except ValueError:
                # Skip invalid statuses
                continue

        return [Image.from_model(img) for img in images]

    # Annotation queries
    @strawberry.field
    async def annotations(self) -> list[Annotation]:
        """Get all annotations."""
        annotations = [ann async for ann in dependencies.annotation_repo.find()]
        return [Annotation.from_model(ann) for ann in annotations]

    @strawberry.field
    async def annotation(self, id: str) -> Annotation | None:  # noqa: A002
        """Get annotation by ID."""
        annotation = await dependencies.annotation_repo.get_by_id(id)
        return Annotation.from_model(annotation) if annotation else None

    @strawberry.field
    async def annotations_by_image(self, image_id: str) -> list[Annotation]:
        """Get all annotations for an image."""
        annotations = [ann async for ann in dependencies.annotation_repo.find_by_image(image_id)]
        return [Annotation.from_model(ann) for ann in annotations]

    # ML Job queries
    @strawberry.field
    async def ml_jobs(self) -> list[MLJob]:
        """Get all ML jobs."""
        jobs = [job async for job in dependencies.ml_job_repo.find()]
        return [MLJob.from_model(job) for job in jobs]

    @strawberry.field
    async def ml_job(self, id: str) -> MLJob | None:  # noqa: A002
        """Get ML job by ID."""
        job = await dependencies.ml_job_repo.get_by_id(id)
        return MLJob.from_model(job) if job else None

    @strawberry.field
    async def ml_jobs_by_status(self, status: str) -> list[MLJob]:
        """Get ML jobs by status."""
        try:
            job_status = MLJobStatus(status)
            jobs = [job async for job in dependencies.ml_job_repo.find_by_status(job_status)]
            return [MLJob.from_model(job) for job in jobs]
        except ValueError:
            return []

    @strawberry.field
    async def ml_jobs_by_image_url(self, image_url: str) -> list[MLJob]:
        """Get ML jobs for a specific image URL."""
        jobs = [job async for job in dependencies.ml_job_repo.find_by_image_url(image_url)]
        return [MLJob.from_model(job) for job in jobs]


@strawberry.type
class Mutation:
    """GraphQL mutations."""

    @strawberry.mutation
    async def create_image(self, input: ImageCreateInput) -> Image:  # noqa: A002
        """Create a new image."""
        image_create = ImageCreate(url=SerializableHttpUrl(input.url))
        image = await dependencies.image_repo.create(image_create)
        return Image.from_model(image)

    @strawberry.mutation
    async def update_image(self, id: str, input: ImageUpdateInput) -> Image | None:  # noqa: A002
        """Update an existing image."""
        update_data = {}
        if input.status is not None:
            update_data["status"] = input.status

        if not update_data:
            # If no updates, return current image
            image = await dependencies.image_repo.get_by_id(id)
            return Image.from_model(image) if image else None

        # Create ImageUpdate model from update_data
        image_update = ImageUpdate(**update_data)  # type: ignore[arg-type]
        image = await dependencies.image_repo.update_by_id(id, image_update)
        return Image.from_model(image) if image else None

    @strawberry.mutation
    async def delete_image(self, id: str) -> bool:  # noqa: A002
        """Delete an image."""
        try:
            return await dependencies.image_repo.delete_by_id(id)
        except Exception:  # noqa: BLE001
            # Return False if ID is invalid or other error occurs
            return False

    # Annotation mutations
    @strawberry.mutation
    async def create_annotation(self, input: AnnotationCreateInput) -> Annotation | None:  # noqa: A002
        """Create a new annotation."""
        try:
            # Convert BoundingBoxInput to BoundingBox model
            bbox = BoundingBox(
                x=input.bounding_box.x,
                y=input.bounding_box.y,
                width=input.bounding_box.width,
                height=input.bounding_box.height,
            )

            annotation_create = AnnotationCreate(
                image_id=PyObjectId(input.image_id),
                bounding_box=bbox,
                tags=input.tags,
                description=input.description,
                confidence=input.confidence,
            )
            annotation = await dependencies.annotation_repo.create(annotation_create)
            return Annotation.from_model(annotation)
        except Exception:  # noqa: BLE001
            # Return None if invalid ObjectId or other validation error
            return None

    @strawberry.mutation
    async def update_annotation(self, id: str, input: AnnotationUpdateInput) -> Annotation | None:  # noqa: A002
        """Update an existing annotation."""
        # Build update data with only fields that are provided
        update_kwargs: dict[str, Any] = {}

        if input.bounding_box is not None:
            update_kwargs["bounding_box"] = BoundingBox(
                x=input.bounding_box.x,
                y=input.bounding_box.y,
                width=input.bounding_box.width,
                height=input.bounding_box.height,
            )

        if input.tags is not None:
            update_kwargs["tags"] = input.tags

        if input.description is not None:
            update_kwargs["description"] = input.description

        if input.confidence is not None:
            update_kwargs["confidence"] = input.confidence

        # Check if there are any updates
        if not update_kwargs:
            # If no updates, return current annotation
            annotation = await dependencies.annotation_repo.get_by_id(id)
            return Annotation.from_model(annotation) if annotation else None

        annotation_update = AnnotationUpdate(**update_kwargs)
        annotation = await dependencies.annotation_repo.update_by_id(id, annotation_update)
        return Annotation.from_model(annotation) if annotation else None

    @strawberry.mutation
    async def delete_annotation(self, id: str) -> bool:  # noqa: A002
        """Delete an annotation."""
        return await dependencies.annotation_repo.delete_by_id(id)

    # ML Job mutations
    @strawberry.mutation
    async def create_ml_job(self, input: MLJobCreateInput) -> MLJob:  # noqa: A002
        """Create a new ML job."""
        ml_job_create = MLJobCreate(
            image_url=SerializableHttpUrl(input.image_url),
            endpoint=input.endpoint,
        )
        ml_job = await dependencies.ml_job_repo.create(ml_job_create)
        return MLJob.from_model(ml_job)

    @strawberry.mutation
    async def update_ml_job_status(self, id: str, status: str, error_message: str | None = None) -> MLJob | None:  # noqa: A002
        """Update ML job status."""
        try:
            job_status = MLJobStatus(status)
            ml_job = await dependencies.ml_job_repo.update_status(id, job_status, error_message)
            return MLJob.from_model(ml_job) if ml_job else None
        except ValueError:
            return None

    @strawberry.mutation
    async def cancel_ml_job(self, id: str) -> MLJob | None:  # noqa: A002
        """Cancel a pending or running ML job."""
        ml_job = await dependencies.ml_job_repo.cancel_job(id)
        return MLJob.from_model(ml_job) if ml_job else None


schema = strawberry.Schema(query=Query, mutation=Mutation)
