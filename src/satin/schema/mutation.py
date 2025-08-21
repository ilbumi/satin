import logging
from datetime import UTC, datetime
from typing import NoReturn

import strawberry
from pymongo.errors import PyMongoError

from satin.constants import MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH
from satin.db import db
from satin.exceptions import ValidationError
from satin.models.image import ImageDimensions, ImageMetadata
from satin.models.task import TaskStatus
from satin.repositories import RepositoryFactory
from satin.schema.annotation import BBoxInput
from satin.schema.image import Image
from satin.schema.project import Project
from satin.schema.task import Task
from satin.schema.utils import convert_pydantic_to_strawberry
from satin.validators.sanitization_decorator import sanitize_graphql_mutation

logger = logging.getLogger(__name__)

# Global repository factory instance
repo_factory = RepositoryFactory(db)

# Error message constants
PROJECT_NOT_FOUND_ERROR = "Project with id %s not found"
IMAGE_NOT_FOUND_ERROR = "Image with id %s not found"
TASK_NOT_FOUND_ERROR = "Task with id %s not found"
FAILED_CREATE_TASK_ERROR = "Failed to create task"
FAILED_UPDATE_TASK_ERROR = "Failed to update task with id %s"
FAILED_RETRIEVE_TASK_ERROR = "Failed to retrieve updated task with id %s"
FAILED_DELETE_TASK_ERROR = "Failed to delete task with id %s"
TASK_DB_ERROR = "Failed to create task due to database error"
TASK_UPDATE_DB_ERROR = "Failed to update task due to database error"
TASK_DELETE_DB_ERROR = "Failed to delete task due to database error"
TASK_UNEXPECTED_ERROR = "An unexpected error occurred while creating the task"
TASK_UPDATE_UNEXPECTED_ERROR = "An unexpected error occurred while updating the task"

PROJECT_NAME_EMPTY_ERROR = "Project name cannot be empty"
PROJECT_NAME_TOO_LONG_ERROR = "Project name cannot exceed %s characters"
PROJECT_DESCRIPTION_TOO_LONG_ERROR = "Project description cannot exceed %s characters"
FAILED_UPDATE_PROJECT_ERROR = "Failed to update project with id %s"
FAILED_RETRIEVE_PROJECT_ERROR = "Failed to retrieve updated project with id %s"
FAILED_DELETE_PROJECT_ERROR = "Failed to delete project with id %s"
PROJECT_HAS_TASKS_ERROR = "Cannot delete project: tasks still reference this project"
PROJECT_DB_ERROR = "Failed to create project due to database error"
PROJECT_UPDATE_DB_ERROR = "Failed to update project due to database error"
PROJECT_DELETE_DB_ERROR = "Failed to delete project due to database error"
PROJECT_UNEXPECTED_ERROR = "An unexpected error occurred while creating the project"
PROJECT_UPDATE_UNEXPECTED_ERROR = "An unexpected error occurred while updating the project"

IMAGE_URL_EMPTY_ERROR = "Image URL cannot be empty"
FAILED_UPDATE_IMAGE_ERROR = "Failed to update image with id %s"
FAILED_RETRIEVE_IMAGE_ERROR = "Failed to retrieve updated image with id %s"
FAILED_DELETE_IMAGE_ERROR = "Failed to delete image with id %s"
IMAGE_HAS_TASKS_ERROR = "Cannot delete image: tasks still reference this image"
IMAGE_DB_ERROR = "Failed to create image due to database error"
IMAGE_UPDATE_DB_ERROR = "Failed to update image due to database error"
IMAGE_DELETE_DB_ERROR = "Failed to delete image due to database error"
IMAGE_UNEXPECTED_ERROR = "An unexpected error occurred while creating the image"
IMAGE_UPDATE_UNEXPECTED_ERROR = "An unexpected error occurred while updating the image"


def _raise_project_not_found(project_id: str) -> NoReturn:
    """Raise project not found error."""
    msg = PROJECT_NOT_FOUND_ERROR % project_id
    raise ValueError(msg)


def _raise_image_not_found(image_id: str) -> NoReturn:
    """Raise image not found error."""
    msg = IMAGE_NOT_FOUND_ERROR % image_id
    raise ValueError(msg)


def _raise_task_not_found(task_id: str) -> NoReturn:
    """Raise task not found error."""
    msg = TASK_NOT_FOUND_ERROR % task_id
    raise ValueError(msg)


def _raise_failed_create_task() -> NoReturn:
    """Raise failed create task error."""
    raise ValueError(FAILED_CREATE_TASK_ERROR)


def _raise_failed_update_task(task_id: str) -> NoReturn:
    """Raise failed update task error."""
    msg = FAILED_UPDATE_TASK_ERROR % task_id
    raise ValueError(msg)


def _raise_failed_retrieve_task(task_id: str) -> NoReturn:
    """Raise failed retrieve task error."""
    msg = FAILED_RETRIEVE_TASK_ERROR % task_id
    raise ValueError(msg)


def _raise_failed_delete_task(task_id: str) -> NoReturn:
    """Raise failed delete task error."""
    msg = FAILED_DELETE_TASK_ERROR % task_id
    raise ValueError(msg)


def _raise_project_name_empty() -> NoReturn:
    """Raise project name empty error."""
    raise ValueError(PROJECT_NAME_EMPTY_ERROR)


def _raise_project_name_too_long() -> NoReturn:
    """Raise project name too long error."""
    msg = PROJECT_NAME_TOO_LONG_ERROR % MAX_NAME_LENGTH
    raise ValueError(msg)


def _raise_project_description_too_long() -> NoReturn:
    """Raise project description too long error."""
    msg = PROJECT_DESCRIPTION_TOO_LONG_ERROR % MAX_DESCRIPTION_LENGTH
    raise ValueError(msg)


def _raise_failed_update_project(project_id: str) -> NoReturn:
    """Raise failed update project error."""
    msg = FAILED_UPDATE_PROJECT_ERROR % project_id
    raise ValueError(msg)


def _raise_failed_retrieve_project(project_id: str) -> NoReturn:
    """Raise failed retrieve project error."""
    msg = FAILED_RETRIEVE_PROJECT_ERROR % project_id
    raise ValueError(msg)


def _raise_failed_delete_project(project_id: str) -> NoReturn:
    """Raise failed delete project error."""
    msg = FAILED_DELETE_PROJECT_ERROR % project_id
    raise ValueError(msg)


def _raise_project_has_tasks() -> NoReturn:
    """Raise project has tasks error."""
    raise ValueError(PROJECT_HAS_TASKS_ERROR)


def _raise_image_url_empty() -> NoReturn:
    """Raise image URL empty error."""
    raise ValueError(IMAGE_URL_EMPTY_ERROR)


def _raise_failed_update_image(image_id: str) -> NoReturn:
    """Raise failed update image error."""
    msg = FAILED_UPDATE_IMAGE_ERROR % image_id
    raise ValueError(msg)


def _raise_failed_retrieve_image(image_id: str) -> NoReturn:
    """Raise failed retrieve image error."""
    msg = FAILED_RETRIEVE_IMAGE_ERROR % image_id
    raise ValueError(msg)


def _raise_failed_delete_image(image_id: str) -> NoReturn:
    """Raise failed delete image error."""
    msg = FAILED_DELETE_IMAGE_ERROR % image_id
    raise ValueError(msg)


def _raise_image_has_tasks() -> NoReturn:
    """Raise image has tasks error."""
    raise ValueError(IMAGE_HAS_TASKS_ERROR)


async def _validate_task_update_references(project_id: strawberry.ID | None, image_id: strawberry.ID | None) -> None:
    """Validate project and image exist for task update."""
    if project_id:
        project = await repo_factory.project_repo.get_project(project_id)
        if not project:
            _raise_project_not_found(str(project_id))

    if image_id:
        image = await repo_factory.image_repo.get_image(image_id)
        if not image:
            _raise_image_not_found(str(image_id))


async def _validate_project_update_input(name: str | None, description: str | None) -> None:
    """Validate project update input parameters."""
    if name is not None:
        if not name.strip():
            _raise_project_name_empty()
        if len(name) > MAX_NAME_LENGTH:
            _raise_project_name_too_long()
    if description is not None and len(description) > MAX_DESCRIPTION_LENGTH:
        _raise_project_description_too_long()


@strawberry.type
class Mutation:
    """Root mutation type for the GraphQL schema."""

    # Task mutations
    @strawberry.mutation
    @sanitize_graphql_mutation
    async def create_task(
        self,
        image_id: strawberry.ID,
        project_id: strawberry.ID,
        bboxes: list[BBoxInput] | None = None,
        status: TaskStatus = TaskStatus.DRAFT,
    ) -> Task:
        """Create a new task."""
        try:
            # Validate that project and image exist
            project = await repo_factory.project_repo.get_project(project_id)
            if not project:
                _raise_project_not_found(str(project_id))

            image = await repo_factory.image_repo.get_image(image_id)
            if not image:
                _raise_image_not_found(str(image_id))

            pydantic_task = await repo_factory.task_repo.create_task(
                image_id=image_id, project_id=project_id, bboxes=bboxes, status=status
            )
            if pydantic_task is None:
                _raise_failed_create_task()
            return convert_pydantic_to_strawberry(pydantic_task, Task)
        except ValidationError as e:
            logger.exception("Validation error creating task")
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error creating task")
            raise ValueError(TASK_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error creating task")
            raise ValueError(TASK_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def update_task(
        self,
        id: strawberry.ID,  # noqa: A002
        image_id: strawberry.ID | None = None,
        project_id: strawberry.ID | None = None,
        bboxes: list[BBoxInput] | None = None,
        status: TaskStatus | None = None,
    ) -> Task:
        """Update an existing task."""
        try:
            # Check if task exists
            existing_task = await repo_factory.task_repo.get_task(id)
            if not existing_task:
                _raise_task_not_found(str(id))

            # Validate referenced entities exist
            await _validate_task_update_references(project_id, image_id)

            success = await repo_factory.task_repo.update_task(
                task_id=id, image_id=image_id, project_id=project_id, bboxes=bboxes, status=status
            )
            if not success:
                _raise_failed_update_task(str(id))

            pydantic_task = await repo_factory.task_repo.get_task(id)
            if pydantic_task is None:
                _raise_failed_retrieve_task(str(id))
            return convert_pydantic_to_strawberry(pydantic_task, Task)
        except ValidationError as e:
            logger.exception("Validation error updating task %s", id)
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error updating task %s", id)
            raise ValueError(TASK_UPDATE_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error updating task %s", id)
            raise ValueError(TASK_UPDATE_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def delete_task(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a task."""
        # Check if task exists
        existing_task = await repo_factory.task_repo.get_task(id)
        if not existing_task:
            _raise_task_not_found(str(id))

        try:
            result = await repo_factory.task_repo.delete_task(id)
            if not result:
                _raise_failed_delete_task(str(id))
            else:
                return result
        except PyMongoError as e:
            logger.exception("Database error deleting task %s", id)
            raise ValueError(TASK_DELETE_DB_ERROR) from e

    # Project mutations
    @strawberry.mutation
    @sanitize_graphql_mutation
    async def create_project(self, name: str, description: str) -> Project:
        """Create a new project."""
        try:
            pydantic_project = await repo_factory.project_repo.create_project(name=name, description=description)
            return convert_pydantic_to_strawberry(pydantic_project, Project)
        except ValidationError as e:
            logger.exception("Validation error creating project")
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error creating project")
            raise ValueError(PROJECT_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error creating project")
            raise ValueError(PROJECT_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def update_project(
        self,
        id: strawberry.ID,  # noqa: A002
        name: str | None = None,
        description: str | None = None,
    ) -> Project:
        """Update an existing project."""
        try:
            # Check if project exists
            existing_project = await repo_factory.project_repo.get_project(id)
            if not existing_project:
                _raise_project_not_found(str(id))

            success = await repo_factory.project_repo.update_project(project_id=id, name=name, description=description)
            if not success:
                _raise_failed_update_project(str(id))

            pydantic_project = await repo_factory.project_repo.get_project(id)
            if pydantic_project is None:
                _raise_failed_retrieve_project(str(id))
            return convert_pydantic_to_strawberry(pydantic_project, Project)
        except ValidationError as e:
            logger.exception("Validation error updating project %s", id)
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error updating project %s", id)
            raise ValueError(PROJECT_UPDATE_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error updating project %s", id)
            raise ValueError(PROJECT_UPDATE_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def delete_project(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a project."""
        # Check if project exists
        existing_project = await repo_factory.project_repo.get_project(id)
        if not existing_project:
            _raise_project_not_found(str(id))

        # Check if project has associated tasks
        has_tasks = await repo_factory.task_repo.has_tasks_for_project(id)
        if has_tasks:
            _raise_project_has_tasks()

        try:
            result = await repo_factory.project_repo.delete_project(id)
            if not result:
                _raise_failed_delete_project(str(id))
            else:
                return result
        except PyMongoError as e:
            logger.exception("Database error deleting project %s", id)
            raise ValueError(PROJECT_DELETE_DB_ERROR) from e

    # Image mutations
    @strawberry.mutation
    @sanitize_graphql_mutation
    async def create_image(self, url: str) -> Image:
        """Create a new image."""
        try:
            # Validate URL
            if not url or not url.strip():
                _raise_image_url_empty()

            # The URL validation happens in the repository through validators
            pydantic_image = await repo_factory.image_repo.create_image(url=url)
            return convert_pydantic_to_strawberry(pydantic_image, Image)
        except ValidationError as e:
            logger.exception("Validation error creating image")
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error creating image")
            raise ValueError(IMAGE_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error creating image")
            raise ValueError(IMAGE_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def create_image_from_upload(
        self,
        url: str,
        filename: str,
        size: int,
        mime_type: str,
        width: int,
        height: int,
        image_format: str | None = None,
    ) -> Image:
        """Create a new image from uploaded file."""
        try:
            # Validate URL
            if not url or not url.strip():
                _raise_image_url_empty()

            # Create metadata
            dimensions = ImageDimensions(width=width, height=height)
            metadata = ImageMetadata(
                filename=filename,
                size=size,
                mime_type=mime_type,
                format=image_format,
                uploaded_at=datetime.now(UTC),
                is_uploaded=True,
            )

            # Create image with metadata
            pydantic_image = await repo_factory.image_repo.create_image(
                url=url, metadata={"dimensions": dimensions.model_dump(), "metadata": metadata.model_dump()}
            )
            return convert_pydantic_to_strawberry(pydantic_image, Image)
        except ValidationError as e:
            logger.exception("Validation error creating image from upload")
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error creating image from upload")
            raise ValueError(IMAGE_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error creating image from upload")
            raise ValueError(IMAGE_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def update_image(
        self,
        id: strawberry.ID,  # noqa: A002
        url: str | None = None,
    ) -> Image:
        """Update an existing image."""
        try:
            # Check if image exists
            existing_image = await repo_factory.image_repo.get_image(id)
            if not existing_image:
                _raise_image_not_found(str(id))

            # Validate URL if provided
            if url is not None and not url.strip():
                _raise_image_url_empty()

            success = await repo_factory.image_repo.update_image(image_id=id, url=url)
            if not success:
                _raise_failed_update_image(str(id))

            pydantic_image = await repo_factory.image_repo.get_image(id)
            if pydantic_image is None:
                _raise_failed_retrieve_image(str(id))
            return convert_pydantic_to_strawberry(pydantic_image, Image)
        except ValidationError as e:
            logger.exception("Validation error updating image %s", id)
            raise ValueError(str(e)) from e
        except PyMongoError as e:
            logger.exception("Database error updating image %s", id)
            raise ValueError(IMAGE_UPDATE_DB_ERROR) from e
        except Exception as e:
            logger.exception("Unexpected error updating image %s", id)
            raise ValueError(IMAGE_UPDATE_UNEXPECTED_ERROR) from e

    @strawberry.mutation
    @sanitize_graphql_mutation
    async def delete_image(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete an image."""
        # Check if image exists
        existing_image = await repo_factory.image_repo.get_image(id)
        if not existing_image:
            _raise_image_not_found(str(id))

        # Check if image has associated tasks
        has_tasks = await repo_factory.task_repo.has_tasks_for_image(id)
        if has_tasks:
            _raise_image_has_tasks()

        try:
            result = await repo_factory.image_repo.delete_image(id)
            if not result:
                _raise_failed_delete_image(str(id))
            else:
                return result
        except PyMongoError as e:
            logger.exception("Database error deleting image %s", id)
            raise ValueError(IMAGE_DELETE_DB_ERROR) from e
