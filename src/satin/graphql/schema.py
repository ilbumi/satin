"""GraphQL schema definition."""

import strawberry

from satin.dependencies import dependencies
from satin.models.annotation import AnnotationCreate, AnnotationUpdate, BoundingBox
from satin.models.base import PyObjectId
from satin.models.image import ImageCreate, ImageUpdate
from satin.models.ml_job import MLJobCreate, MLJobStatus
from satin.models.tag import TagCreate, TagUpdate
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
    Tag,
    TagCreateInput,
    TagUpdateInput,
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

    @strawberry.field
    async def active_annotations_by_image(self, image_id: str) -> list[Annotation]:
        """Get active (non-deleted) annotations for an image."""
        annotations = [ann async for ann in dependencies.annotation_repo.get_active_annotations_for_image(image_id)]
        return [Annotation.from_model(ann) for ann in annotations]

    @strawberry.field
    async def annotation_version_history(self, image_id: str) -> list[Annotation]:
        """Get version history for annotations on an image."""
        annotations = [ann async for ann in dependencies.annotation_repo.get_version_history(image_id)]
        return [Annotation.from_model(ann) for ann in annotations]

    # Tag queries
    @strawberry.field
    async def tags(self) -> list[Tag]:
        """Get all tags."""
        tags = [tag async for tag in dependencies.tag_repo.find()]
        return [Tag.from_model(tag) for tag in tags]

    @strawberry.field
    async def tag(self, id: str) -> Tag | None:  # noqa: A002
        """Get tag by ID."""
        tag = await dependencies.tag_repo.get_by_id(id)
        return Tag.from_model(tag) if tag else None

    @strawberry.field
    async def root_tags(self) -> list[Tag]:
        """Get all root tags (tags without parents)."""
        tags = [tag async for tag in dependencies.tag_repo.get_root_tags()]
        return [Tag.from_model(tag) for tag in tags]

    @strawberry.field
    async def tag_children(self, parent_id: str) -> list[Tag]:
        """Get direct children of a tag."""
        tags = [tag async for tag in dependencies.tag_repo.get_children(parent_id)]
        return [Tag.from_model(tag) for tag in tags]

    @strawberry.field
    async def tag_tree(self, root_id: str | None = None) -> list[Tag]:
        """Get complete tag tree starting from root or all roots."""
        tags = [tag async for tag in dependencies.tag_repo.get_tree_from_root(root_id)]
        return [Tag.from_model(tag) for tag in tags]

    @strawberry.field
    async def search_tags(self, name_pattern: str) -> list[Tag]:
        """Search tags by name pattern."""
        tags = [tag async for tag in dependencies.tag_repo.search_by_name(name_pattern)]
        return [Tag.from_model(tag) for tag in tags]

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
        image_update = ImageUpdate(**update_data)
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

            # Convert string tag IDs to PyObjectId
            tag_ids = [PyObjectId(tag_id) for tag_id in input.tags]

            annotation_create = AnnotationCreate(
                image_id=PyObjectId(input.image_id),
                bounding_box=bbox,
                tags=tag_ids,
                description=input.description,
                confidence=input.confidence,
            )
            annotation = await dependencies.annotation_repo.create_versioned(annotation_create)
            return Annotation.from_model(annotation)
        except Exception:  # noqa: BLE001
            # Return None if invalid ObjectId or other validation error
            return None

    @strawberry.mutation
    async def update_annotation(self, id: str, input: AnnotationUpdateInput) -> Annotation | None:  # noqa: A002
        """Update an existing annotation (creates new version)."""
        # Build update data with proper types
        bounding_box = None
        if input.bounding_box is not None:
            bounding_box = BoundingBox(
                x=input.bounding_box.x,
                y=input.bounding_box.y,
                width=input.bounding_box.width,
                height=input.bounding_box.height,
            )

        tags = None
        if input.tags is not None:
            tags = [PyObjectId(tag_id) for tag_id in input.tags]

        # Check if there are any updates
        if bounding_box is None and tags is None and input.description is None and input.confidence is None:
            # If no updates, return current annotation
            annotation = await dependencies.annotation_repo.get_by_id(id)
            return Annotation.from_model(annotation) if annotation else None

        annotation_update = AnnotationUpdate(
            bounding_box=bounding_box,
            tags=tags,
            description=input.description,
            confidence=input.confidence,
        )
        annotation = await dependencies.annotation_repo.update_versioned(id, annotation_update)
        return Annotation.from_model(annotation) if annotation else None

    @strawberry.mutation
    async def delete_annotation(self, id: str) -> Annotation | None:  # noqa: A002
        """Soft delete an annotation (creates delete version)."""
        annotation = await dependencies.annotation_repo.soft_delete_versioned(id)
        return Annotation.from_model(annotation) if annotation else None

    @strawberry.mutation
    async def restore_annotation_version(self, image_id: str, version: int) -> Annotation | None:
        """Restore annotation to a specific version."""
        annotation = await dependencies.annotation_repo.restore_version(image_id, version)
        return Annotation.from_model(annotation) if annotation else None

    # Tag mutations
    @strawberry.mutation
    async def create_tag(self, input: TagCreateInput) -> Tag:  # noqa: A002
        """Create a new tag."""
        try:
            tag_create = TagCreate(
                name=input.name,
                description=input.description,
                parent_id=input.parent_id,
                color=input.color,
            )
            tag = await dependencies.tag_repo.create_hierarchical(tag_create)
            return Tag.from_model(tag)
        except Exception:  # noqa: BLE001
            # If parent_id is invalid, create as root tag
            tag_create = TagCreate(
                name=input.name,
                description=input.description,
                parent_id=None,
                color=input.color,
            )
            tag = await dependencies.tag_repo.create_hierarchical(tag_create)
            return Tag.from_model(tag)

    @strawberry.mutation
    async def update_tag(self, id: str, input: TagUpdateInput) -> Tag | None:  # noqa: A002
        """Update an existing tag."""
        update_data = {}

        if input.name is not None:
            update_data["name"] = input.name
        if input.description is not None:
            update_data["description"] = input.description
        if input.parent_id is not None:
            update_data["parent_id"] = input.parent_id
        if input.color is not None:
            update_data["color"] = input.color

        if not update_data:
            # If no updates, return current tag
            tag = await dependencies.tag_repo.get_by_id(id)
            return Tag.from_model(tag) if tag else None

        tag_update = TagUpdate(**update_data)
        tag = await dependencies.tag_repo.update_hierarchical(id, tag_update)
        return Tag.from_model(tag) if tag else None

    @strawberry.mutation
    async def delete_tag(self, id: str) -> int:  # noqa: A002
        """Delete a tag and all its descendants."""
        try:
            return await dependencies.tag_repo.delete_with_descendants(id)
        except Exception:  # noqa: BLE001
            return 0

    @strawberry.mutation
    async def move_tag(self, tag_id: str, new_parent_id: str | None) -> Tag | None:
        """Move a tag to a new parent."""
        tag = await dependencies.tag_repo.move_tag(tag_id, new_parent_id)
        return Tag.from_model(tag) if tag else None

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
