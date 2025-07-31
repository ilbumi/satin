from typing import Any

import strawberry
from pymongo.asynchronous.database import AsyncDatabase

from satin.schema.project import Project

from .base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    """Repository for Project domain objects."""

    def __init__(self, db: AsyncDatabase):
        """Initialize the ProjectRepository with a database connection."""
        super().__init__(db, "projects")

    async def to_domain_object(self, data: dict[str, Any]) -> Project:
        """Convert database document to Project domain object."""
        data = self._convert_id(data)
        return Project(**data)

    async def get_project(self, project_id: strawberry.ID) -> Project | None:
        """Fetch a project by its ID from the database."""
        project_data = await self.find_by_id(project_id)
        if project_data:
            return await self.to_domain_object(project_data)
        return None

    async def get_all_projects(self, limit: int | None = None, offset: int = 0) -> list[Project]:
        """Fetch paginated projects using MongoDB aggregation pipeline."""
        results_data = await self.find_all(limit=limit, offset=offset)
        return [await self.to_domain_object(data) for data in results_data]

    async def create_project(self, name: str, description: str) -> Project:
        """Create a new project in the database."""
        project_data = {"name": name, "description": description}
        created_data = await self.create(project_data)
        return await self.to_domain_object(created_data)

    async def update_project(
        self, project_id: strawberry.ID, name: str | None = None, description: str | None = None
    ) -> bool:
        """Update a project in the database."""
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description

        return await self.update_by_id(project_id, update_data)

    async def delete_project(self, project_id: strawberry.ID) -> bool:
        """Delete a project from the database."""
        return await self.delete_by_id(project_id)
