import strawberry

from satin.db import db
from satin.repositories import RepositoryFactory
from satin.schema.filters import QueryInput
from satin.schema.image import Image
from satin.schema.project import Project
from satin.schema.task import Task

# Global repository factory instance
repo_factory = RepositoryFactory(db)


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
        return await repo_factory.project_repo.get_project(id)

    @strawberry.field
    async def projects(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Project]:
        """Get paginated projects with optional filtering and sorting."""
        # Use query input if provided, otherwise use legacy parameters
        if query:
            projects = await repo_factory.project_repo.get_all_projects(query_input=query)
            total_count = await repo_factory.project_repo.count_all_projects(query_input=query)
            has_more = query.offset + len(projects) < total_count
            return Page(
                objects=projects,
                total_count=total_count,
                count=len(projects),
                limit=query.limit,
                offset=query.offset,
                has_more=has_more,
            )
        # Legacy behavior for backward compatibility
        projects = await repo_factory.project_repo.get_all_projects(limit=limit, offset=offset)
        total_count = await repo_factory.project_repo.count_all_projects()
        has_more = offset + len(projects) < total_count
        return Page(
            objects=projects,
            total_count=total_count,
            count=len(projects),
            limit=limit,
            offset=offset,
            has_more=has_more,
        )

    @strawberry.field
    async def image(self, id: strawberry.ID) -> Image | None:  # noqa: A002
        """Get an image by ID."""
        return await repo_factory.image_repo.get_image(id)

    @strawberry.field
    async def images(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Image]:
        """Get paginated images with optional filtering and sorting."""
        # Use query input if provided, otherwise use legacy parameters
        if query:
            images = await repo_factory.image_repo.get_all_images(query_input=query)
            total_count = await repo_factory.image_repo.count_all_images(query_input=query)
            has_more = query.offset + len(images) < total_count
            return Page(
                objects=images,
                total_count=total_count,
                count=len(images),
                limit=query.limit,
                offset=query.offset,
                has_more=has_more,
            )
        # Legacy behavior for backward compatibility
        images = await repo_factory.image_repo.get_all_images(limit=limit, offset=offset)
        total_count = await repo_factory.image_repo.count_all_images()
        has_more = offset + len(images) < total_count
        return Page(
            objects=images,
            total_count=total_count,
            count=len(images),
            limit=limit,
            offset=offset,
            has_more=has_more,
        )

    @strawberry.field
    async def task(self, id: strawberry.ID) -> Task | None:  # noqa: A002
        """Get a task by ID."""
        return await repo_factory.task_repo.get_task(id)

    @strawberry.field
    async def tasks(self, limit: int = 10, offset: int = 0, query: QueryInput | None = None) -> Page[Task]:
        """Get paginated tasks with optional filtering and sorting."""
        # Use query input if provided, otherwise use legacy parameters
        if query:
            tasks = await repo_factory.task_repo.get_all_tasks(query_input=query)
            total_count = await repo_factory.task_repo.count_all_tasks(query_input=query)
            has_more = query.offset + len(tasks) < total_count
            return Page(
                objects=tasks,
                total_count=total_count,
                count=len(tasks),
                limit=query.limit,
                offset=query.offset,
                has_more=has_more,
            )
        # Legacy behavior for backward compatibility
        tasks = await repo_factory.task_repo.get_all_tasks(limit=limit, offset=offset)
        total_count = await repo_factory.task_repo.count_all_tasks()
        has_more = offset + len(tasks) < total_count
        return Page(
            objects=tasks,
            total_count=total_count,
            count=len(tasks),
            limit=limit,
            offset=offset,
            has_more=has_more,
        )

    @strawberry.field
    async def task_by_image_and_project(self, image_id: strawberry.ID, project_id: strawberry.ID) -> Task | None:
        """Get a task by image and project IDs."""
        return await repo_factory.task_repo.get_task_by_image_and_project(image_id, project_id)
