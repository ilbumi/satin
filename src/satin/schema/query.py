from __future__ import annotations

from typing import TypeVar

import strawberry

from satin.db import db
from satin.repositories import RepositoryFactory
from satin.schema.filters import QueryInput  # noqa: TC001
from satin.schema.image import Image
from satin.schema.project import Project
from satin.schema.task import Task
from satin.schema.utils import convert_pydantic_to_strawberry

# Global repository factory instance
repo_factory = RepositoryFactory(db)

T = TypeVar("T")


@strawberry.type
class Page[T]:
    """Generic connection type for pagination."""

    objects: list[T]
    total_count: int
    count: int
    limit: int
    offset: int
    has_more: bool


@strawberry.type
class Query:
    """Root query type for the GraphQL schema."""

    @strawberry.field
    async def project(self, id: strawberry.ID) -> Project | None:  # noqa: A002
        """Get a project by ID."""
        pydantic_project = await repo_factory.project_repo.get_project(id)
        if pydantic_project is None:
            return None
        return convert_pydantic_to_strawberry(pydantic_project, Project)

    @strawberry.field
    async def projects(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Project]:
        """Get paginated projects."""
        # Convert QueryInput to native QueryModel if needed
        query_model = query.to_pydantic() if query else None

        # Use query limit/offset if provided, otherwise use function parameters
        actual_limit = query_model.limit if query_model else limit
        actual_offset = query_model.offset if query_model else offset

        pydantic_projects = await repo_factory.project_repo.get_all_projects(
            limit=actual_limit, offset=actual_offset, query_input=query_model
        )
        projects = [convert_pydantic_to_strawberry(p, Project) for p in pydantic_projects]
        total_count = await repo_factory.project_repo.count_all_projects(query_input=query_model)
        has_more = actual_offset + len(projects) < total_count
        return Page(
            objects=projects,
            total_count=total_count,
            count=len(projects),
            limit=actual_limit,
            offset=actual_offset,
            has_more=has_more,
        )

    @strawberry.field
    async def image(self, id: strawberry.ID) -> Image | None:  # noqa: A002
        """Get an image by ID."""
        pydantic_image = await repo_factory.image_repo.get_image(id)
        if pydantic_image is None:
            return None
        return convert_pydantic_to_strawberry(pydantic_image, Image)

    @strawberry.field
    async def images(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Image]:
        """Get paginated images."""
        query_model = query.to_pydantic() if query else None

        # Use query limit/offset if provided, otherwise use function parameters
        actual_limit = query_model.limit if query_model else limit
        actual_offset = query_model.offset if query_model else offset

        pydantic_images = await repo_factory.image_repo.get_all_images(
            limit=actual_limit, offset=actual_offset, query_input=query_model
        )
        images = [convert_pydantic_to_strawberry(img, Image) for img in pydantic_images]
        total_count = await repo_factory.image_repo.count_all_images(query_input=query_model)
        has_more = actual_offset + len(images) < total_count
        return Page(
            objects=images,
            total_count=total_count,
            count=len(images),
            limit=actual_limit,
            offset=actual_offset,
            has_more=has_more,
        )

    @strawberry.field
    async def task(self, id: strawberry.ID) -> Task | None:  # noqa: A002
        """Get a task by ID."""
        pydantic_task = await repo_factory.task_repo.get_task(id)
        if pydantic_task is None:
            return None
        return convert_pydantic_to_strawberry(pydantic_task, Task)

    @strawberry.field
    async def tasks(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Task]:
        """Get paginated tasks."""
        query_model = query.to_pydantic() if query else None

        # Use query limit/offset if provided, otherwise use function parameters
        actual_limit = query_model.limit if query_model else limit
        actual_offset = query_model.offset if query_model else offset

        pydantic_tasks = await repo_factory.task_repo.get_all_tasks(
            limit=actual_limit, offset=actual_offset, query_input=query_model
        )
        tasks = [convert_pydantic_to_strawberry(task, Task) for task in pydantic_tasks]
        total_count = await repo_factory.task_repo.count_all_tasks(query_input=query_model)
        has_more = actual_offset + len(tasks) < total_count
        return Page(
            objects=tasks,
            total_count=total_count,
            count=len(tasks),
            limit=actual_limit,
            offset=actual_offset,
            has_more=has_more,
        )

    @strawberry.field
    async def task_by_image_and_project(self, image_id: strawberry.ID, project_id: strawberry.ID) -> Task | None:
        """Get a task by image and project IDs."""
        pydantic_task = await repo_factory.task_repo.get_task_by_image_and_project(image_id, project_id)
        if pydantic_task is None:
            return None
        return convert_pydantic_to_strawberry(pydantic_task, Task)
