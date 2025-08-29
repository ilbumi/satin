"""GraphQL schema definition."""

from typing import Any

import strawberry
import structlog
from pydantic import ValidationError

from satin.dependencies import dependencies
from satin.models.annotation import AnnotationCreate, AnnotationUpdate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageStatus, ImageUpdate
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.utils import SerializableHttpUrl

from .decorators import handle_mutation_errors, handle_query_errors
from .errors import DeleteResult
from .extensions import RequestLoggingExtension
from .pagination import PageInfo, PaginationInput, SortInput, encode_cursor
from .types import (
    Annotation,
    AnnotationConnection,
    AnnotationCreateInput,
    AnnotationFilterInput,
    AnnotationUpdateInput,
    CreateAnnotationResult,
    CreateImageResult,
    CreateMLJobResult,
    Image,
    ImageConnection,
    ImageCreateInput,
    ImageFilterInput,
    ImageUpdateInput,
    MLJob,
    MLJobConnection,
    MLJobCreateInput,
    MLJobFilterInput,
    UpdateAnnotationResult,
    UpdateImageResult,
    UpdateMLJobResult,
)

logger = structlog.get_logger(__name__)


def empty_image_connection() -> ImageConnection:
    """Return an empty image connection for error cases."""
    return ImageConnection(
        items=[],
        page_info=PageInfo(
            has_next_page=False,
            has_previous_page=False,
            start_cursor=None,
            end_cursor=None,
            total_count=0,
        ),
        total_count=0,
    )


def empty_annotation_connection() -> AnnotationConnection:
    """Return an empty annotation connection for error cases."""
    return AnnotationConnection(
        items=[],
        page_info=PageInfo(
            has_next_page=False,
            has_previous_page=False,
            start_cursor=None,
            end_cursor=None,
            total_count=0,
        ),
        total_count=0,
    )


def empty_ml_job_connection() -> MLJobConnection:
    """Return an empty ML job connection for error cases."""
    return MLJobConnection(
        items=[],
        page_info=PageInfo(
            has_next_page=False,
            has_previous_page=False,
            start_cursor=None,
            end_cursor=None,
            total_count=0,
        ),
        total_count=0,
    )


@strawberry.type
class Query:
    """GraphQL queries."""

    # Paginated queries
    @strawberry.field
    @handle_query_errors(default_value=empty_image_connection())
    async def images(
        self,
        pagination: PaginationInput | None = None,
        filter: ImageFilterInput | None = None,  # noqa: A002
        sort: SortInput | None = None,
    ) -> ImageConnection:
        """Get paginated images with filtering and sorting."""
        # Set defaults
        if pagination is None:
            pagination = PaginationInput()

        # Build filter
        filter_dict: dict[str, Any] = {}
        if filter:
            if filter.status:
                filter_dict["status"] = filter.status.value
            if filter.statuses:
                filter_dict["status"] = {"$in": [s.value for s in filter.statuses]}
            if filter.url_contains:
                filter_dict["url"] = {"$regex": filter.url_contains, "$options": "i"}

        sort_list = [(sort.field, sort.order.value)] if sort else [("created_at", -1)]

        # Get paginated results
        items, total_count = await dependencies.image_repo.find_paginated_with_count(
            filter_dict=filter_dict,
            skip=pagination.offset,
            limit=pagination.limit,
            sort=sort_list,
        )

        # Build page info
        has_next = pagination.offset + len(items) < total_count
        has_prev = pagination.offset > 0

        page_info = PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=encode_cursor(str(pagination.offset)) if items else None,
            end_cursor=encode_cursor(str(pagination.offset + len(items) - 1)) if items else None,
            total_count=total_count,
        )

        return ImageConnection(
            items=[Image.from_model(img) for img in items],
            page_info=page_info,
            total_count=total_count,
        )

    @strawberry.field
    @handle_query_errors()
    async def image(self, id: str) -> Image | None:  # noqa: A002
        """Get image by ID."""
        image = await dependencies.image_repo.get_by_id(PyObjectId(id))
        return Image.from_model(image) if image else None

    @strawberry.field
    @handle_query_errors(default_value=[])
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
    @handle_query_errors(default_value=empty_annotation_connection())
    async def annotations(
        self,
        pagination: PaginationInput | None = None,
        filter: AnnotationFilterInput | None = None,  # noqa: A002
        sort: SortInput | None = None,
    ) -> AnnotationConnection:
        """Get paginated annotations with filtering and sorting."""
        if pagination is None:
            pagination = PaginationInput()

        # Build filter
        filter_dict: dict[str, Any] = {}
        if filter:
            if filter.image_id:
                filter_dict["image_id"] = PyObjectId(filter.image_id)
            if filter.has_tags:
                filter_dict["tags"] = {"$all": filter.has_tags}
            if filter.confidence_min is not None:
                filter_dict.setdefault("confidence", {})["$gte"] = filter.confidence_min
            if filter.confidence_max is not None:
                filter_dict.setdefault("confidence", {})["$lte"] = filter.confidence_max
            if filter.source:
                filter_dict["source"] = filter.source

        # Build sort
        sort_list = [(sort.field, sort.order.value)] if sort else [("created_at", -1)]

        # Get paginated results
        items, total_count = await dependencies.annotation_repo.find_paginated_with_count(
            filter_dict=filter_dict,
            skip=pagination.offset,
            limit=pagination.limit,
            sort=sort_list,
        )

        # Build page info
        has_next = pagination.offset + len(items) < total_count
        has_prev = pagination.offset > 0

        page_info = PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=encode_cursor(str(pagination.offset)) if items else None,
            end_cursor=encode_cursor(str(pagination.offset + len(items) - 1)) if items else None,
            total_count=total_count,
        )

        return AnnotationConnection(
            items=[Annotation.from_model(ann) for ann in items],
            page_info=page_info,
            total_count=total_count,
        )

    @strawberry.field
    @handle_query_errors()
    async def annotation(self, id: str) -> Annotation | None:  # noqa: A002
        """Get annotation by ID."""
        annotation = await dependencies.annotation_repo.get_by_id(PyObjectId(id))
        return Annotation.from_model(annotation) if annotation else None

    @strawberry.field
    @handle_query_errors(default_value=[])
    async def annotations_by_image(self, image_id: str) -> list[Annotation]:
        """Get all annotations for an image."""
        annotations = [ann async for ann in dependencies.annotation_repo.find_by_image(PyObjectId(image_id))]
        return [Annotation.from_model(ann) for ann in annotations]

    # ML Job queries
    @strawberry.field
    @handle_query_errors(default_value=empty_ml_job_connection())
    async def ml_jobs(
        self,
        pagination: PaginationInput | None = None,
        filter: MLJobFilterInput | None = None,  # noqa: A002
        sort: SortInput | None = None,
    ) -> MLJobConnection:
        """Get paginated ML jobs with filtering and sorting."""
        if pagination is None:
            pagination = PaginationInput()

        # Build filter
        filter_dict: dict[str, Any] = {}
        if filter:
            if filter.status:
                filter_dict["status"] = filter.status.value
            if filter.image_url:
                filter_dict["image_url"] = filter.image_url
            if filter.endpoint:
                filter_dict["endpoint"] = filter.endpoint

        # Build sort
        sort_list = [(sort.field, sort.order.value)] if sort else [("created_at", -1)]

        # Get paginated results
        items, total_count = await dependencies.ml_job_repo.find_paginated_with_count(
            filter_dict=filter_dict,
            skip=pagination.offset,
            limit=pagination.limit,
            sort=sort_list,
        )

        # Build page info
        has_next = pagination.offset + len(items) < total_count
        has_prev = pagination.offset > 0

        page_info = PageInfo(
            has_next_page=has_next,
            has_previous_page=has_prev,
            start_cursor=encode_cursor(str(pagination.offset)) if items else None,
            end_cursor=encode_cursor(str(pagination.offset + len(items) - 1)) if items else None,
            total_count=total_count,
        )

        return MLJobConnection(
            items=[MLJob.from_model(job) for job in items],
            page_info=page_info,
            total_count=total_count,
        )

    @strawberry.field
    @handle_query_errors()
    async def ml_job(self, id: str) -> MLJob | None:  # noqa: A002
        """Get ML job by ID."""
        job = await dependencies.ml_job_repo.get_by_id(PyObjectId(id))
        return MLJob.from_model(job) if job else None

    @strawberry.field
    @handle_query_errors(default_value=[])
    async def ml_jobs_by_status(self, status: str) -> list[MLJob]:
        """Get ML jobs by status."""
        try:
            job_status = MLJobStatus(status)
            jobs = [job async for job in dependencies.ml_job_repo.find_by_status(job_status)]
            return [MLJob.from_model(job) for job in jobs]
        except ValueError:
            return []

    @strawberry.field
    @handle_query_errors(default_value=[])
    async def ml_jobs_by_image_url(self, image_url: str) -> list[MLJob]:
        """Get ML jobs for a specific image URL."""
        jobs = [job async for job in dependencies.ml_job_repo.find_by_image_url(image_url)]
        return [MLJob.from_model(job) for job in jobs]


@strawberry.type
class Mutation:
    """GraphQL mutations."""

    @strawberry.mutation
    @handle_mutation_errors("Image")
    async def create_image(self, input: ImageCreateInput) -> CreateImageResult:  # noqa: A002
        """Create a new image."""
        image_create = ImageCreate(url=SerializableHttpUrl(input.url))
        image = await dependencies.image_repo.create(image_create)
        return Image.from_model(image)  # type: ignore[return-value]

    @strawberry.mutation
    @handle_mutation_errors("Image")
    async def update_image(self, id: str, input: ImageUpdateInput) -> UpdateImageResult:  # noqa: A002
        """Update an existing image."""
        update_data = {}
        if input.status is not None:
            update_data["status"] = input.status

        if not update_data:
            # If no updates, return current image
            image = await dependencies.image_repo.get_by_id(PyObjectId(id))
            return Image.from_model(image) if image else None  # type: ignore[return-value]

        # Create ImageUpdate model from update_data
        image_update = ImageUpdate(**update_data)  # type: ignore[arg-type]
        image = await dependencies.image_repo.update_by_id(PyObjectId(id), image_update)
        return Image.from_model(image) if image else None  # type: ignore[return-value]

    @strawberry.mutation
    async def delete_image(self, id: str) -> DeleteResult:  # noqa: A002
        """Delete an image."""
        try:
            object_id = PyObjectId(id)
            deleted = await dependencies.image_repo.delete_by_id(object_id)
            if deleted:
                return DeleteResult.success("Image")
            return DeleteResult.not_found("Image")
        except (ValueError, TypeError, ValidationError):
            # Invalid ObjectId format or validation error
            return DeleteResult.not_found("Image")

    # Annotation mutations
    @strawberry.mutation
    @handle_mutation_errors("Annotation")
    async def create_annotation(self, input: AnnotationCreateInput) -> CreateAnnotationResult:  # noqa: A002
        """Create a new annotation."""
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
        return Annotation.from_model(annotation)  # type: ignore[return-value]

    @strawberry.mutation
    @handle_mutation_errors("Annotation")
    async def update_annotation(self, id: str, input: AnnotationUpdateInput) -> UpdateAnnotationResult:  # noqa: A002
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
            annotation = await dependencies.annotation_repo.get_by_id(PyObjectId(id))
            return Annotation.from_model(annotation) if annotation else None  # type: ignore[return-value]

        annotation_update = AnnotationUpdate(**update_kwargs)
        annotation = await dependencies.annotation_repo.update_by_id(PyObjectId(id), annotation_update)
        return Annotation.from_model(annotation) if annotation else None  # type: ignore[return-value]

    @strawberry.mutation
    async def delete_annotation(self, id: str) -> DeleteResult:  # noqa: A002
        """Delete an annotation."""
        try:
            object_id = PyObjectId(id)
            deleted = await dependencies.annotation_repo.delete_by_id(object_id)
            if deleted:
                return DeleteResult.success("Annotation")
            return DeleteResult.not_found("Annotation")
        except (ValueError, TypeError, ValidationError):
            # Invalid ObjectId format or validation error
            return DeleteResult.not_found("Annotation")

    # ML Job mutations
    @strawberry.mutation
    @handle_mutation_errors("MLJob")
    async def create_ml_job(self, input: MLJobCreateInput) -> CreateMLJobResult:  # noqa: A002
        """Create a new ML job."""
        ml_job_create = MLJobCreate(
            image_url=SerializableHttpUrl(input.image_url),
            endpoint=input.endpoint,
        )
        ml_job = await dependencies.ml_job_repo.create(ml_job_create)
        return MLJob.from_model(ml_job)  # type: ignore[return-value]

    @strawberry.mutation
    @handle_mutation_errors("MLJob")
    async def update_ml_job_status(self, id: str, status: str, error_message: str | None = None) -> UpdateMLJobResult:  # noqa: A002
        """Update ML job status."""
        job_status = MLJobStatus(status)  # Will raise ValueError if invalid
        ml_job = await dependencies.ml_job_repo.update_status(PyObjectId(id), job_status, error_message)
        return MLJob.from_model(ml_job) if ml_job else None  # type: ignore[return-value]

    @strawberry.mutation
    @handle_mutation_errors("MLJob")
    async def cancel_ml_job(self, id: str) -> UpdateMLJobResult:  # noqa: A002
        """Cancel a pending or running ML job."""
        ml_job = await dependencies.ml_job_repo.cancel_job(PyObjectId(id))
        return MLJob.from_model(ml_job) if ml_job else None  # type: ignore[return-value]


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[RequestLoggingExtension],
)
