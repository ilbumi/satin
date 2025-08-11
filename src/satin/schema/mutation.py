import strawberry

from satin.db import db
from satin.models.task import TaskStatus
from satin.repositories import RepositoryFactory
from satin.schema.annotation import BBoxInput
from satin.schema.image import Image
from satin.schema.project import Project
from satin.schema.task import Task

# Global repository factory instance
repo_factory = RepositoryFactory(db)


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
        pydantic_task = await repo_factory.task_repo.create_task(
            image_id=image_id, project_id=project_id, bboxes=bboxes, status=status
        )
        if pydantic_task is None:
            return None
        return Task.from_pydantic(pydantic_task)  # type: ignore[no-any-return,attr-defined]

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
        success = await repo_factory.task_repo.update_task(
            task_id=id, image_id=image_id, project_id=project_id, bboxes=bboxes, status=status
        )
        if success:
            pydantic_task = await repo_factory.task_repo.get_task(id)
            if pydantic_task is None:
                return None
            return Task.from_pydantic(pydantic_task)  # type: ignore[no-any-return,attr-defined]
        return None

    @strawberry.mutation
    async def delete_task(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a task."""
        return await repo_factory.task_repo.delete_task(id)

    # Project mutations
    @strawberry.mutation
    async def create_project(self, name: str, description: str) -> Project:
        """Create a new project."""
        pydantic_project = await repo_factory.project_repo.create_project(name=name, description=description)
        return Project.from_pydantic(pydantic_project)  # type: ignore[no-any-return,attr-defined]

    @strawberry.mutation
    async def update_project(
        self,
        id: strawberry.ID,  # noqa: A002
        name: str | None = None,
        description: str | None = None,
    ) -> Project | None:
        """Update an existing project."""
        success = await repo_factory.project_repo.update_project(project_id=id, name=name, description=description)
        if success:
            pydantic_project = await repo_factory.project_repo.get_project(id)
            if pydantic_project is None:
                return None
            return Project.from_pydantic(pydantic_project)  # type: ignore[no-any-return,attr-defined]
        return None

    @strawberry.mutation
    async def delete_project(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete a project."""
        return await repo_factory.project_repo.delete_project(id)

    # Image mutations
    @strawberry.mutation
    async def create_image(self, url: str) -> Image:
        """Create a new image."""
        pydantic_image = await repo_factory.image_repo.create_image(url=url)
        return Image.from_pydantic(pydantic_image)  # type: ignore[no-any-return,attr-defined]

    @strawberry.mutation
    async def update_image(
        self,
        id: strawberry.ID,  # noqa: A002
        url: str | None = None,
    ) -> Image | None:
        """Update an existing image."""
        success = await repo_factory.image_repo.update_image(image_id=id, url=url)
        if success:
            pydantic_image = await repo_factory.image_repo.get_image(id)
            if pydantic_image is None:
                return None
            return Image.from_pydantic(pydantic_image)  # type: ignore[no-any-return,attr-defined]
        return None

    @strawberry.mutation
    async def delete_image(self, id: strawberry.ID) -> bool:  # noqa: A002
        """Delete an image."""
        return await repo_factory.image_repo.delete_image(id)
