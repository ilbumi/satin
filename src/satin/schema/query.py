import strawberry

from satin.schema.image import Image, get_all_images, get_image
from satin.schema.project import Project, get_all_projects, get_project
from satin.schema.task import Task, get_all_tasks, get_task, get_task_by_image_and_project


@strawberry.type
class Page[T]:
    """Generic connection type for pagination."""

    objects: list[T]
    count: int
    limit: int
    offset: int


@strawberry.type
class Query:
    """Root query type for the GraphQL schema."""

    @strawberry.field
    async def project(self, id: strawberry.ID) -> Project | None:  # noqa: A002
        """Get a project by ID."""
        return await get_project(id)

    @strawberry.field
    async def projects(self, limit: int = 10, offset: int = 0) -> Page[Project]:
        """Get paginated projects."""
        projects = await get_all_projects(limit=limit, offset=offset)

        return Page(objects=projects, count=len(projects), limit=limit, offset=offset)

    @strawberry.field
    async def image(self, id: strawberry.ID) -> Image | None:  # noqa: A002
        """Get an image by ID."""
        return await get_image(id)

    @strawberry.field
    async def images(self, limit: int = 10, offset: int = 0) -> Page[Image]:
        """Get paginated images."""
        images = await get_all_images(limit=limit, offset=offset)

        return Page(objects=images, count=len(images), limit=limit, offset=offset)

    @strawberry.field
    async def task(self, id: strawberry.ID) -> Task | None:  # noqa: A002
        """Get a task by ID."""
        return await get_task(id)

    @strawberry.field
    async def tasks(self, limit: int = 10, offset: int = 0) -> Page[Task]:
        """Get paginated tasks."""
        tasks = await get_all_tasks(limit=limit, offset=offset)

        return Page(objects=tasks, count=len(tasks), limit=limit, offset=offset)

    @strawberry.field
    async def task_by_image_and_project(self, image_id: strawberry.ID, project_id: strawberry.ID) -> Task | None:
        """Get a task by image and project IDs."""
        return await get_task_by_image_and_project(image_id, project_id)
