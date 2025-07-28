import strawberry

from satin.schema.annotation import BBoxInput
from satin.schema.image import Image, create_image, delete_image, update_image
from satin.schema.project import Project, create_project, delete_project, update_project
from satin.schema.task import Task, TaskStatus, create_task, delete_task, update_task


@strawberry.type
class Mutation:
    """Root mutation type for the GraphQL schema."""

    # Task mutations
    @strawberry.mutation
    async def create_task(
        self,
        image_id: strawberry.ID,
        project_id: strawberry.ID,
        bboxes: list[BBoxInput] | None = None,
        status: TaskStatus = TaskStatus.DRAFT,
    ) -> Task:
        """Create a new task."""
        return await create_task(image_id=image_id, project_id=project_id, bboxes=bboxes, status=status)  # type: ignore[arg-type]

    @strawberry.mutation
    async def update_task(
        self,
        id: strawberry.ID,  # noqa: A002
        image_id: strawberry.ID | None = None,
        project_id: strawberry.ID | None = None,
        bboxes: list[BBoxInput] | None = None,
        status: TaskStatus | None = None,
    ) -> Task | None:
        """Update an existing task."""
        return await update_task(id=id, image_id=image_id, project_id=project_id, bboxes=bboxes, status=status)  # type: ignore[arg-type]

    @strawberry.mutation
    async def delete_task(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a task."""
        return await delete_task(id)

    # Project mutations
    @strawberry.mutation
    async def create_project(self, name: str, description: str) -> Project:
        """Create a new project."""
        return await create_project(name=name, description=description)

    @strawberry.mutation
    async def update_project(
        self,
        id: strawberry.ID,  # noqa: A002
        name: str | None = None,
        description: str | None = None,
    ) -> Project | None:
        """Update an existing project."""
        return await update_project(id=id, name=name, description=description)

    @strawberry.mutation
    async def delete_project(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a project."""
        return await delete_project(id)

    # Image mutations
    @strawberry.mutation
    async def create_image(self, url: str) -> Image:
        """Create a new image."""
        return await create_image(url=url)

    @strawberry.mutation
    async def update_image(
        self,
        id: strawberry.ID,  # noqa: A002
        url: str | None = None,
    ) -> Image | None:
        """Update an existing image."""
        return await update_image(id=id, url=url)

    @strawberry.mutation
    async def delete_image(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete an image."""
        return await delete_image(id)
